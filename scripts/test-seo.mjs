import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

const canonicalOrigin='https://www.padashgroup.ir';
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([^\s=<>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m=>[m[1],m[2]??m[3]]));
const tags=(html,name)=>[...html.matchAll(new RegExp('<'+name+'\\b[^>]*>','g'))].map(m=>attrs(m[0]));
const visibleBody=html=>(html.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1]||'')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,'')
  .replace(/<link\b[^>]*>/g,'').replace(/<meta\b[^>]*>/g,'').replace(/<title\b[^>]*>[\s\S]*?<\/title>/g,'').replace(/\s+/g,' ').trim();
const hash=value=>createHash('sha256').update(value).digest('hex');
const requestWithHost=(origin,path,host)=>new Promise((resolve,reject)=>{
  // Node 22 fetch can discard a custom Host header; exercise real HTTP routing.
  const url=new URL(path,origin),send=url.protocol==='https:'?httpsRequest:httpRequest;
  const request=send(url,{headers:{Host:host}},response=>{response.resume();resolve({status:response.statusCode,location:response.headers.location});});
  request.on('error',reject);request.setTimeout(15000,()=>request.destroy(new Error('Redirect check timed out')));request.end();
});
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
      assert.equal(node.name,'بازرگانی پاداش');assert.deepEqual(node.alternateName,['پاداش','Padash Trading','Padash']);assert.equal(node.url,canonicalOrigin+'/');
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
  assert.equal(new Set(urls).size,urls.length,'sitemap URLs are unique');assert(urls.length>=41);
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
    assert(value('robots').some(tag=>tag.content.includes('max-image-preview:large')),path+' permits large image previews');
    assert(!/noindex/.test(response.headers.get('x-robots-tag')||''));
    assert(/<html[^>]*\blang="fa"/.test(html)&&/<html[^>]*\bdir="rtl"/.test(html));
    assert.equal([...html.matchAll(/<h1\b[^>]*>/g)].length,1,path+' has one visible H1');
    const levels=[...html.matchAll(/<h([1-6])\b[^>]*>/g)].map(match=>Number(match[1]));
    for(let i=1;i<levels.length;i++)assert(levels[i]<=levels[i-1]+1,path+' does not skip heading levels');
    const schemaTypes=validateSchemas(html,path);
    if(path.startsWith('/products/')&&!path.startsWith('/products/category/'))assert(value('description')[0].content.includes('استعلام قیمت'));
    for(const image of tags(html,'img')){
      assert('alt' in image,path+' images have alt attributes');
      assert(image.width&&image.height||image.style?.includes('position:absolute'),path+' reserves image space');
    }
    const visibleHash=hash(visibleBody(html));
    pages.push({path,status:response.status,title:titles[0][1],description:value('description')[0].content,canonical:links[0].href,schemaTypes,visibleHash});
  }
  assert.equal(new Set(pages.map(page=>page.title)).size,pages.length,'no duplicate titles');
  assert.equal(new Set(pages.map(page=>page.description)).size,pages.length,'no duplicate descriptions');
  const images=[...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(m=>m[1]);
  for(const block of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)){
    const path=new URL(block[1].match(/<loc>([^<]+)<\/loc>/)[1]).pathname,html=htmlByPath.get(path);
    const pageImages=[...block[1].matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(m=>m[1]);
    if(!pageImages.length)continue;
    const links=tags(html,'a'),pictures=tags(html,'img');
    const pageSchema=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])).find(node=>node['@type']==='WebPage');
    assert.deepEqual(pageSchema.image.map(image=>image.contentUrl),pageImages,'all gallery images have truthful image metadata');
    for(const url of pageImages){
      const imagePath=new URL(url).pathname;
      assert(links.some(link=>link.href===imagePath),'full-size gallery image is linked without JavaScript: '+imagePath);
      assert(pictures.some(image=>image.alt?.length>5&&(image.src===imagePath||new URL(image.src,canonicalOrigin).searchParams.get('url')===imagePath)),'gallery image has descriptive alt: '+imagePath);
    }
  }
  const oldSource=JSON.parse(await readFile(new URL('../docs/catalog-source.json',import.meta.url),'utf8'));
  const newSource=JSON.parse(await readFile(new URL('../docs/new-product-image-sources.json',import.meta.url),'utf8'));
  const expectedImages=[...new Set([...oldSource.products.flatMap(product=>product.images.map(image=>canonicalOrigin+image.src)),...newSource.assets.map(image=>canonicalOrigin+image.src)])];
  assert.deepEqual([...new Set(images)].sort(),expectedImages.sort(),'all original and new product photographs are discoverable');
  for(const image of new Set(images)){assert(image.startsWith(canonicalOrigin+'/images/products/'));assert.equal((await request(new URL(image).pathname)).status,200);}
  for(const page of pages.filter(page=>page.path.startsWith('/guides/'))){
    const block=xml.match(new RegExp('<url>\\s*<loc>'+canonicalOrigin+page.path+'<\\/loc>([\\s\\S]*?)<\\/url>'))?.[1];
    assert(block&&/<lastmod>[^<]+<\/lastmod>/.test(block),'guides keep their actual last modification date');
  }
  const targets=new Set();
  for(const [path,html] of htmlByPath)for(const link of tags(html,'a'))if(link.href?.startsWith('/')&&!link.href.startsWith('//'))targets.add(new URL(link.href,origin+path).pathname);
  for(const target of targets)if(!htmlByPath.has(target))assert.equal((await request(target)).status,200,'crawlable internal destination '+target);
  for(const path of ['/products/not-a-product','/products/category/not-a-category','/guides/not-a-guide','/news/not-a-news-id','/not-a-real-page']){
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
  for(const host of ['padashgroup.ir','padash-five.vercel.app'])for(const path of ['/','/about','/contact','/products/el-r','/products/category/eps','/calculator?product=eps-sheet','/guides/elastomeric-insulation-guide','/sitemap.xml']){
    const response=await requestWithHost(origin,path,host);
    assert.equal(response.status,308,host+path+' permanently redirects');
    assert.equal(response.location,canonicalOrigin+path,'one hop, preserving path and query');
  }
  for(const host of ['padashgroup.ir','padash-five.vercel.app']){
    const response=await requestWithHost(origin,'/products/el-r/?utm_source=seo-audit',host);
    assert.equal(response.status,308);assert.equal(response.location,canonicalOrigin+'/products/el-r?utm_source=seo-audit','host and trailing slash canonicalize in one hop');
    assert.equal((await requestWithHost(origin,'/management',host)).status,200,'private routes keep their original host');
  }
  const slash=await request('/products/el-r/',{redirect:'manual'});
  assert.equal(slash.status,308);assert.equal(slash.headers.get('location'),'/products/el-r');
  const verification=await request('/googlec8009b90c25c4c6c.html');assert.equal(verification.status,200);
  assert.equal((await verification.text()).trim(),'google-site-verification: googlec8009b90c25c4c6c.html');
  const home=htmlByPath.get('/');
  const favicon=tags(home,'link').find(link=>link.rel==='icon');
  assert.equal(favicon?.href,'/images/padash-icon.png','favicon keeps its stable branded URL');
  assert.equal(favicon.sizes,'96x96');
  const faviconResponse=await request(favicon.href);assert.equal(faviconResponse.status,200);
  assert(faviconResponse.headers.get('content-type').startsWith('image/png'));
  assert(!/noindex/.test(faviconResponse.headers.get('x-robots-tag')||''));
  const faviconBytes=Buffer.from(await faviconResponse.arrayBuffer());
  assert.equal(faviconBytes.readUInt32BE(16),96);assert.equal(faviconBytes.readUInt32BE(20),96,'favicon is square and matches declared size');
  assert(tags(home,'a').some(link=>link.href==='/about'),'About has a real crawlable destination as well as a homepage dialog');
  for(const [path,html] of htmlByPath)for(const target of ['/products','/contact'])assert(tags(html,'a').some(link=>link.href===target),path+' exposes primary navigation '+target);
  assert(htmlByPath.get('/about').includes('"@type":"AboutPage"'));
  const about=htmlByPath.get('/about');
  for(const text of ['ما فقط عایق نمی‌فروشیم','چرا بازرگانی پاداش؟','چشم‌انداز ما','هدف ما فراتر از فروش محصول است','فناوری، کیفیت و مسئولیت‌پذیری'])assert(about.includes(text),'owner-selected About copy is crawlable: '+text);
  const aboutNodes=[...about.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(match=>{const schema=JSON.parse(match[1]);return schema['@graph']||[schema];});
  const aboutSchema=aboutNodes.find(node=>node['@type']==='AboutPage');
  assert.equal(aboutSchema.description,pages.find(page=>page.path==='/about').description,'About metadata and schema use the same approved description');
  assert(aboutSchema.description.includes('حرارتی، برودتی و صوتی'));
  assert(Number.isFinite(Date.parse(aboutSchema.dateModified)),'About schema has its actual content update date');
  assert(htmlByPath.get('/contact').includes('"@type":"ContactPage"')&&htmlByPath.get('/contact').includes('tel:+989112243632'));
  const hero=tags(home,'img').find(image=>image.alt==='لوگوی بازرگانی پاداش');
  assert(hero&&!hero.loading,'the homepage LCP image is not lazy-loaded');
  assert(tags(home,'link').some(link=>link.rel==='preload'&&link.as==='image'),'hero image is preloaded');
  const catalogue=htmlByPath.get('/products');
  const categoryPaths=urls.map(url=>new URL(url).pathname).filter(path=>path.startsWith('/products/category/'));
  assert.equal(categoryPaths.length,10);
  const footer=home.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1]||'';
  for(const path of categoryPaths){
    assert(tags(catalogue,'a').some(link=>link.href===path),'category has a crawlable HTML link: '+path);
    assert(tags(footer,'a').some(link=>link.href===path),'homepage footer links every category: '+path);
    assert(htmlByPath.get(path).includes('"@type":"CollectionPage"'));
  }
  for(const [accept,mime] of [['image/webp','image/webp'],['image/avif,image/webp','image/avif']]){
    const response=await request('/_next/image?url=%2Fimages%2Fpadash-logo.webp&w=256&q=75',{headers:{Accept:accept}});
    assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),mime);
  }
  let unchangedBodies;
  if(baselineDirectory){
    const before=JSON.parse(await readFile(resolve(baselineDirectory,'pages-before.json'),'utf8'));
    for(const page of before)assert.equal(pages.find(current=>current.path===page.path)?.visibleHash,page.visibleHash,'visible HTML unchanged: '+page.path);
    unchangedBodies=before.length;
    await writeFile(resolve(baselineDirectory,'pages-after.json'),JSON.stringify(pages,null,2));
  }
  return {pagesChecked:pages.length,productPages:pages.filter(page=>page.path.startsWith('/products/')&&!page.path.startsWith('/products/category/')).length,categoryPages:categoryPaths.length,images:images.length,internalDestinations:targets.size,unchangedBodies,pages};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=await auditSeo(process.argv[2]||'http://127.0.0.1:5173',{baselineDirectory:process.argv[3]});
  const summary={pagesChecked:result.pagesChecked,productPages:result.productPages,images:result.images,internalDestinations:result.internalDestinations,unchangedBodies:result.unchangedBodies};console.log('PASS: SEO metadata, canonical, robots, sitemap images, schema contracts, 404s, private noindex, crawlable links and query canonicalisation.');console.log(JSON.stringify(summary,null,2));
}
