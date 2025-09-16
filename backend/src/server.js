import express from 'express';
import { ENV } from './config/env.js';
import { db } from './config/db.js';
import { favsTable } from './db/schema.js';
import { and, eq } from "drizzle-orm";
import job from './config/cron.js';

const app = express();
const PORT = ENV.PORT || 5001;

if(ENV.NODE_ENV === "production") job.start();

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true });
});

app.post("/api/favorites", async(req, res) => {
    try {
        const { userId, recipeId, ratingId, title, image, cookTime, servings } = req.body;        

        if(!userId || !recipeId || !title) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newFav = await db.insert(favsTable).values({
            userId,
            recipeId,
            ratingId: ratingId ?? null,
            title,
            image,
            cookTime,
            servings,
        }).returning();
        
        res.status(201).json(newFav[0]);
    } catch (error) {
        console.error("Error bookmarking: ", error);
        res.status(500).json({ error: "Internal server error" });
    } 
});

app.get("/api/favorites/:userId", async(req, res) => {
    try {
        const { userId } = req.params;

        const userFavs = await db
            .select()
            .from(favsTable)
            .where(eq(favsTable.userId, userId));

        res.status(200).json(userFavs);
    } catch (error) {
        console.error("Error fetching the favorites: ", error);
        res.status(500).json({ error: "Internal server error" });
    } 
});

app.put("/api/favorites/:userId/:recipeId/rating", async(req, res) => {
    try {
        const { userId, recipeId } = req.params;
        const { ratingId } = req.body;
        console.log("modify????ratinggggggg", userId, recipeId, ratingId);

        if (!userId || !recipeId) {
            return res.status(400).json({ error: "Missing required params" });
        }
        
        const updatedRow = await db
        .update(favsTable)
        .set({ ratingId })
        .where(and(
            eq(favsTable.userId, userId),
            eq(favsTable.recipeId, recipeId)
        ))
        .returning();

        if (!updatedRow.length) {
            return res.status(404).json({ error: "Favorite not found" });
        }

        res.status(200).json(updatedRow[0]);
    } catch (error) {
        console.log("Error updating rating: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete("/api/favorites/:userId/:recipeId", async(req, res) => {
    try {
        const { userId, recipeId }  = req.params;

        await db
        .delete(favsTable)
        .where(
            and(eq(favsTable.userId, userId), eq(favsTable.recipeId, parseInt(recipeId)))
        );

        res.status(200).json({ message: "Favorite removed successfully" });
    } catch (error) {
        console.error("Error deleting favorite: ", error);
        res.status(500).json({ error: "Internal server error" });
    } 
});

app.listen(PORT, () => {
    console.log('Server is running on PORT:', PORT);
}); 