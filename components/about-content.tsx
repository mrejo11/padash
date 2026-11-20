import {aboutProfile} from '../lib/business-profile';
import styles from './about-content.module.css';

export default function AboutContent() {
  return <div className={styles.copy}>{aboutProfile.sections.map(section=><section key={section.id} aria-labelledby={'about-'+section.id}>
    <h2 id={'about-'+section.id}>{section.heading}</h2>
    {section.paragraphs.map((paragraph,index)=><p key={index}>{paragraph.map((part,partIndex)=>typeof part==='string'?part:<strong key={partIndex}>{part.strong}</strong>)}</p>)}
  </section>)}</div>;
}
