import { storageAvailable } from '../../../lib/service-status';
export const dynamic='force-dynamic';
export async function GET(){const available=await storageAvailable();return Response.json({status:available?'ok':'unavailable'},{status:available?200:503,headers:{'Cache-Control':'no-store'}});}
