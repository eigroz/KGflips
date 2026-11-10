import fs from 'node:fs';
const plans={
 'index.html':{
 'ticket-block-text-8':'Ticket card · Directions link','ticket-block-href-1':'Ticket card · Directions link',
 'ticket-block-text-9':'Ticket card · Large price','ticket-block-text-10':'Ticket card · Large price',
 'ticket-block-text-11':'Ticket card · Green badge','ticket-block-text-12':'Ticket card · Green badge',
 'ticket-block-text-13':'Ticket card · Credit callout','ticket-block-text-14':'Ticket card · Credit callout',
 'ticket-block-text-15':'Ticket card · Buy button','ticket-block-text-16':'Ticket card · Underlined credit link','ticket-block-text-17':'Ticket card · Small print',
 'main-block-text-8':'Main block · Event details button','main-block-href-1':'Main block · Event details button',
 'middle-block-lucky-duck-text-15':'Lucky Duck · Offer rules button','more-ways-to-shop-text-3':'More ways to shop · Button','more-ways-to-shop-href-1':'More ways to shop · Button',
 'ticket-popup-text-18':'Ticket popup · Square payment button','ticket-popup-href-2':'Ticket popup · Square payment button'},
 'event.html':{'event-details-text-17':'Event page · Directions button','event-details-href-3':'Event page · Directions button','event-details-text-18':'Event page · Tickets button','event-details-href-4':'Event page · Tickets button'},
 'coming-soon.html':{'coming-soon-page-text-5':'Coming soon · Tickets button','coming-soon-page-href-1':'Coming soon · Tickets button'}
};
for(const [name,plan] of Object.entries(plans)){
 const prefix=name.slice(0,-5)+'-';
 let html=fs.readFileSync(name,'utf8');
 html=html.replace(/<!--cms:([\w-]+)\|([^>]+)-->/g,(m,id)=>plan[id.slice(prefix.length)]?'<!--cms:'+id+'|'+plan[id.slice(prefix.length)]+'-->':m);
 html=html.replace(/(data-cms-attr="([\w-]+)"\s+data-cms-group=")[^"]+(")/g,(m,a,id,b)=>plan[id.slice(prefix.length)]?a+plan[id.slice(prefix.length)]+b:m);
 fs.writeFileSync(name,html);
}

