import {sqliteTable,text,index} from 'drizzle-orm/sqlite-core';
export const quotes=sqliteTable('quotes',{
 id:text('id').primaryKey(), token:text('token').notNull().unique(), name:text('name').notNull(), company:text('company').notNull(), phone:text('phone').notNull(), city:text('city').notNull(), items:text('items').notNull(), message:text('message').notNull().default(''), status:text('status').notNull().default('new'), createdAt:text('created_at').notNull(), ipHash:text('ip_hash').notNull(),
},table=>[index('quotes_ip_created_idx').on(table.ipHash,table.createdAt)]);
