import {getSql} from "@/lib/db";
import {ensureOrganizationSchema,requestOwnerId} from "@/lib/organization";

export const runtime="nodejs";
export async function GET(request:Request){
  try{
    const ownerId=requestOwnerId(request);await ensureOrganizationSchema();const sql=getSql();
    await sql`INSERT INTO org_settings(owner_id) VALUES(${ownerId}) ON CONFLICT(owner_id) DO NOTHING`;
    const [time,finance,reserves,next,settings,mail]=await Promise.all([
      sql`SELECT
        COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at,now())-started_at))/60) FILTER(WHERE started_at>=date_trunc('week',now())),0)::int AS week_minutes,
        COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at,now())-started_at))/60) FILTER(WHERE area='ecg' AND started_at>=date_trunc('week',now()) AND volunteer=false),0)::int AS ecg_week_minutes,
        COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at,now())-started_at))/60) FILTER(WHERE volunteer=true AND started_at>=date_trunc('week',now())),0)::int AS volunteer_minutes
        FROM org_time_entries WHERE owner_id=${ownerId} AND deleted_at IS NULL AND approval_status='confirmed'`,
      sql`SELECT COALESCE(SUM(CASE WHEN kind='income' THEN amount_cents ELSE 0 END),0)::bigint AS income_cents,COALESCE(SUM(CASE WHEN kind='expense' THEN amount_cents ELSE 0 END),0)::bigint AS expense_cents FROM org_finance_entries WHERE owner_id=${ownerId} AND deleted_at IS NULL AND entry_date>=date_trunc('month',now())::date`,
      sql`SELECT COALESCE(SUM(CASE WHEN due_date IS NULL THEN target_cents/GREATEST(interval_months,1) ELSE GREATEST(target_cents-saved_cents,0)/GREATEST(CEIL(EXTRACT(EPOCH FROM (due_date::timestamp-now()))/2629800),1) END),0)::bigint AS monthly_required_cents FROM org_reserves WHERE owner_id=${ownerId} AND deleted_at IS NULL`,
      sql`SELECT * FROM org_schedule_entries WHERE owner_id=${ownerId} AND deleted_at IS NULL AND starts_at>=now() ORDER BY starts_at LIMIT 5`,
      sql`SELECT * FROM org_settings WHERE owner_id=${ownerId} LIMIT 1`,
      sql`SELECT subject,sender,received_at,relevance,suggested_action FROM org_mail_items WHERE owner_id=${ownerId} AND processed=false AND relevance IN ('urgent','important') ORDER BY received_at DESC NULLS LAST LIMIT 5`
    ]);
    const s=settings[0] as any,t=time[0] as any;
    const credited=Math.min(Number(s.ecg_presence_credit_minutes),Number(s.ecg_weekly_target_minutes));
    return Response.json({
      week_minutes:Number(t.week_minutes),ecg_week_minutes:Number(t.ecg_week_minutes),volunteer_minutes:Number(t.volunteer_minutes),
      ecg_target_minutes:Number(s.ecg_weekly_target_minutes),ecg_presence_credit_minutes:credited,
      ecg_remaining_minutes:Math.max(0,Number(s.ecg_weekly_target_minutes)-credited-Number(t.ecg_week_minutes)),
      income_cents:Number((finance[0] as any).income_cents),expense_cents:Number((finance[0] as any).expense_cents),
      reserve_monthly_cents:Number((reserves[0] as any).monthly_required_cents),next,mail
    });
  }catch(error){
    const status=error instanceof Error&&error.message==="FORBIDDEN"?403:500;
    return Response.json({error:error instanceof Error?error.message:"Übersicht konnte nicht geladen werden."},{status});
  }
}
