import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const favsTable = pgTable('favs', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    recipeId: integer('recipe_id').notNull(),
    ratingId: integer('rating_id').default(null),
    title: text('title').notNull(),
    image: text('image'),
    cookTime: text('cook_time'),
    servings: text('servings'),
    createdAt: timestamp('created_at').defaultNow(),
});