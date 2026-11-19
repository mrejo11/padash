import Link from 'next/link';
import {ArrowLeft} from 'lucide-react';
import {insulationTopics,topicsForProducts} from '../lib/insulation-topics';

export function InsulationHub({home=false}:{home?:boolean}){
  return <section className={'insulation-hub'+(home?' section container':'')} id="insulation-applications" aria-labelledby="insulation-topics-heading">
    <div className="section-heading"><div><span className="section-kicker">انتخاب بر اساس نیاز</span><h2 id="insulation-topics-heading">عایق مناسب کدام کاربرد را می‌خواهید؟</h2><p>کاربرد را مشخص کنید؛ سپس جنس و مشخصات محصول را بررسی کنید.</p></div></div>
    <div className="insulation-topic-grid">{insulationTopics.map(topic=><article className="insulation-topic-card" key={topic.id}><h3><Link href={topic.path}>{topic.name}</Link></h3><p>{topic.summary}</p><Link className="text-button" href={topic.path}>انتخاب و استعلام {topic.name}<ArrowLeft size={17}/></Link></article>)}</div>
  </section>;
}
export function RelatedInsulation({productIds}:{productIds:string[]}){
  const topics=topicsForProducts(productIds);
  return topics.length>0?<section className="article-related"><h2>انتخاب بر اساس کاربرد</h2>{topics.map(topic=><Link href={topic.path} key={topic.id}>انتخاب و خرید {topic.name}</Link>)}</section>:null;
}
