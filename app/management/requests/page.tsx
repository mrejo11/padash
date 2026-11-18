import Management from '../management';
import {statusLabels} from '../../../lib/management-model';
export const metadata={title:'درخواست‌های مشتریان'};
export default async function RequestsPage({searchParams}:{searchParams:Promise<{kind?:string;status?:string}>}){
  const {kind,status}=await searchParams;
  const initialKind=['order','consultation'].includes(kind||'')?kind!:'';
  const initialStatus=Object.hasOwn(statusLabels,status||'')?status!:'';
  return <Management key={initialKind+initialStatus} view="requests" initialKind={initialKind} initialStatus={initialStatus}/>;
}
