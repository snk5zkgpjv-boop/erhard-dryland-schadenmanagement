export async function GET(){return Response.json({ok:true,app:"erhard-dryland-schadenmanagement",version:"0.8.0",aiConfigured:Boolean(process.env.OPENAI_API_KEY)})}
