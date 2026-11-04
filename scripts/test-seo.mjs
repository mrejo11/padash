import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const canonicalOrigin='https://padashco.netlify.app';
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([^\s=<>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m=>[m[1],m[2]??m[3]]));
const tags=(html,name)=>[...html.matchAll(new RegExp('<'+name+'\\b[^>]*>','g'))].map(m=>attrs(m[0]));
const visibleBody=html=>(html.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1]||'')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,'')
  .replace(/<link\b[^>]*>/g,'').replace(/<meta\b[^>]*>/g,'').replace(/<title\b[^>]*>[\s\S]*?<\/title>/g,'').replace(/\s+/g,' ').trim();
const hash=value=>createHash('sha256').update(value).digest('hex');
function validateSchemas(html,path){
  const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  assert(schemas.length>0,path+' has JSON-LD');
  for(const schema of schemas)assert.equal(schema['@context'],'https://schema.org');
  const nodes=schemas.flatMap(schema=>schema['@graph']||[schema]);
  for(const node of nodes){
    assert.equal(typeof node['@type'],'string');
    if(node['@type']==='BreadcrumbList'){
      assert(node.itemListElement.length>=2);
      node.itemListElement.forEach((item,index)=>{assert.equal(item.position,index+1);assert(item.name);assert(item.item.startsWith(canonicalOrigin+'/'));});
    }
    if(node['@type']==='Article'){
      assert(node.headline&&node.author?.name&&node.publisher?.name);
      assert.equal(node.mainEntityOfPage,canonicalOrigin+path);
      assert(Number.isFinite(Date.parse(node.datePublished))&&Number.isFinite(Date.parse(node.dateModified)));
      assert(Date.parse(node.dateModified)>=Date.parse(node.datePublished));
      assert(html.includes(node.headline.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')),'article headline matches the visible article');
    }
    if(node['@type']==='WebSite'){
      assert.equal(node.name,'بازرگانی پاداش');assert.equal(node.alternateName,'پاداش');assert.equal(node.url,canonicalOrigin+'/');
    }
    if(node['@type']==='Organization'){
      assert.equal(node.name,'بازرگانی پاداش');assert.equal(node.url,canonicalOrigin);
      assert.equal(node.contactPoint.length,2);assert.equal(node.contactPoint[0].telephone,'+989112243632');
    }
    if(node['@type']==='ItemList'){
      assert.equal(node.numberOfItems,node.itemListElement.length);
      node.itemListElement.forEach((item,index)=>{assert.equal(item.position,index+1);assert(item.url.startsWith(canonicalOrigin+'/products/'));});
    }
    if(node.primaryImageOfPage){
      assert.equal(node.primaryImageOfPage['@type'],'ImageObject');assert(node.primaryImageOfPage.width>0&&node.primaryImageOfPage.height>0);
      assert(node.primaryImageOfPage.url.startsWith(canonicalOrigin+'/images/products/'));
    }
    assert(!['Product','Offer','AggregateOffer','AggregateRating','Review'].includes(node['@type']),'family listings must not fabricate merchant or review data');
  }
  if(path==='/products')assert(nodes.some(node=>node['@type']==='CollectionPage')&&nodes.some(node=>node['@type']==='BreadcrumbList'));
  return nodes.map(node=>node['@type']);
}

export async function auditSeo(origin,{baselineDirectory}={}){
  const request=(path,options={})=>fetch(origin+path,{headers:{'User-Agent':'Twitterbot'},signal:AbortSignal.timeout(30000),...options});
  const sitemapResponse=await request('/sitemap.xml');assert.equal(sitemapResponse.status,200);
  const xml=await sitemapResponse.text();
  const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  assert.equal(new Set(urls).size,urls.length,'sitemap URLs are unique');assert(urls.length>=21);
  for(const url of urls){assert(url.startsWith(canonicalOrigin+'/'));assert(!/[?#]/.test(url));assert(!/\/(management|request|api)(\/|$)/.test(new URL(url).pathname));}
  const robots=await(await request('/robots.txt')).text();
  assert(robots.includes('Sitemap: '+canonicalOrigin+'/sitemap.xml'));assert(robots.includes('Allow: /'));assert(robots.includes('Disallow: /api/'));assert(!/^Disallow: \/\s*$/m.test(robots));
  const pages=[],htmlByPath=new Map();
  for(const url of urls){
    const path=new URL(url).pathname,response=await request(path);assert.equal(response.status,200,path);
    const html=await response.text();htmlByPath.set(path,html);
    const head=html.match(/<head[^>]*>([\s\S]*?)<\/head>/)?.[1];assert(head,path+' has head');
    const meta=tags(head,'meta'),value=name=>meta.filter(tag=>tag.name===name||tag.property===name);
    const titles=[...head.matchAll(/<title>([^<]*)<\/title>/g)];assert.equal(titles.length,1,path+' has one title');
    assert.equal(value('description').length,1);assert(value('description')[0].content.length>=40);
    const links=tags(head,'link').filter(tag=>tag.rel==='canonical');assert.equal(links.length,1);assert.equal(new URL(links[0].href).href,new URL(url).href);
    assert.equal(new URL(value('og:url')[0]?.content).href,new URL(url).href);
    for(const name of ['og:title','og:description','og:image','twitter:title','twitter:description','twitter:image'])assert.equal(value(name).length,1,path+' '+name);
    assert(value('og:image')[0].content.startsWith(canonicalOrigin+'/images/'));
    assert(!value('robots').some(tag=>/noindex/.test(tag.content)),path+' is indexable');
    assert(!/noindex/.test(response.headers.get('x-robots-tag')||''));
    assert(/<html[^>]*\blang="fa"/.test(html)&&/<html[^>]*\bdir="rtl"/.test(html));
    assert.equal([...html.matchAll(/<h1\b[^>]*>/g)].length,1,path+' has one visible H1');
    const schemaTypes=validateSchemas(html,path);
    if(path.startsWith('/products/'))assert(value('description')[0].content.includes('استعلام قیمت'));
    const visibleHash=hash(visibleBody(html));
    pages.push({path,status:response.status,title:titles[0][1],description:value('description')[0].content,canonical:links[0].href,schemaTypes,visibleHash});
  }
  assert.equal(new Set(pages.map(page=>page.title)).size,pages.length,'no duplicate titles');
  assert.equal(new Set(pages.map(page=>page.description)).size,pages.length,'no duplicate descriptions');
  const images=[...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(m=>m[1]);
  assert.equal(new Set(images).size,19,'all 19 existing product images are discoverable');
  for(const image of new Set(images)){assert(image.startsWith(canonicalOrigin+'/images/products/'));assert.equal((await request(new URL(image).pathname)).status,200);}
  for(const page of pages.filter(page=>page.path.startsWith('/guides/'))){
    const block=xml.match(new RegExp('<url>\\s*<loc>'+canonicalOrigin+page.path+'<\\/loc>([\\s\\S]*?)<\\/url>'))?.[1];
    assert(block&&/<lastmod>[^<]+<\/lastmod>/.test(block),'guides keep their actual last modification date');
  }
  const targets=new Set();
  for(const [path,html] of htmlByPath)for(const link of tags(html,'a'))if(link.href?.startsWith('/')&&!link.href.startsWith('//'))targets.add(new URL(link.href,origin+path).pathname);
  for(const target of targets)if(!htmlByPath.has(target))assert.equal((await request(target)).status,200,'crawlable internal destination '+target);
  for(const path of ['/products/not-a-product','/guides/not-a-guide','/news/not-a-news-id','/not-a-real-page']){
    const response=await request(path);assert.equal(response.status,404,path);
    assert(tags(await response.text(),'meta').some(tag=>tag.name==='robots'&&tag.content.includes('noindex')),'404 pages are noindex');
  }
  for(const path of ['/management','/management/news']){
    const response=await request(path);assert.equal(response.status,200);assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
    assert(tags(await response.text(),'meta').some(tag=>tag.name==='robots'&&tag.content.includes('noindex')));
  }
  for(const query of ['?product=vn-1213','?product=vn-1219','?product=invalid','?utm_source=seo-audit']){
    const response=await request('/calculator'+query);assert.equal(response.status,200);
    assert.equal(tags(await response.text(),'link').find(tag=>tag.rel==='canonical')?.href,canonicalOrigin+'/calculator');
  }
  let unchangedBodies;
  if(baselineDirectory){
    const before=JSON.parse(await readFile(resolve(baselineDirectory,'pages-before.json'),'utf8'));
    for(const page of before)assert.equal(pages.find(current=>current.path===page.path)?.visibleHash,page.visibleHash,'visible HTML unchanged: '+page.path);
    unchangedBodies=before.length;
    await writeFile(resolve(baselineDirectory,'pages-after.json'),JSON.stringify(pages,null,2));
  }
  return {pagesChecked:pages.length,productPages:pages.filter(page=>page.path.startsWith('/products/')).length,images:images.length,internalDestinations:targets.size,unchangedBodies,pages};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=await auditSeo(process.argv[2]||'http://127.0.0.1:5173',{baselineDirectory:process.argv[3]});
  const {pages,...summary}=result;console.log('PASS: SEO metadata, canonical, robots, sitemap images, schema contracts, 404s, private noindex, crawlable links and query canonicalisation.');console.log(JSON.stringify(summary,null,2));
}
