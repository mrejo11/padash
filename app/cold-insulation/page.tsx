import InsulationLanding from '../../components/insulation-landing';
import {topicFor} from '../../lib/insulation-topics';
import {pageMetadata} from '../../lib/seo';
const topic=topicFor('cold');
export const metadata=pageMetadata(topic.title,topic.description,topic.path);
export default function ColdInsulation(){return <InsulationLanding id="cold"/>;}
