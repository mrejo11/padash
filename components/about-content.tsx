import {aboutProfile} from '../lib/business-profile';
import styles from './about-content.module.css';

export default function AboutContent({headingLevel=2,idPrefix='about'}:{headingLevel?:2|3;idPrefix?:string}) {
  const Heading=headingLevel===2?'h2':'h3';
  return <div className={styles.copy}>{aboutProfile.sections.map(section=><section key={section.id} aria-labelledby={idPrefix+'-'+section.id}>
    <Heading id={idPrefix+'-'+section.id}>{section.heading}</Heading>
    {section.paragraphs.map((paragraph,index)=><p key={index}>{paragraph.map((part,partIndex)=>typeof part==='string'?part:<strong key={partIndex}>{part.strong}</strong>)}</p>)}
  </section>)}</div>;
}
