import InsulationLanding from '../../components/insulation-landing';
import {topicFor} from '../../lib/insulation-topics';
import {pageMetadata} from '../../lib/seo';
const topic=topicFor('sound');
export const metadata=pageMetadata(topic.title,topic.description,topic.path);
export default function SoundInsulation(){return <InsulationLanding id="sound"/>;}
