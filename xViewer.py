from pymongo import MongoClient
import pandas as pd

# Replace with your Atlas URI
client = MongoClient("mongodb+srv://rafiqmohamed025_db_user:1924CY@cluster0.kxikrnk.mongodb.net/?appName=Cluster0")

db = client["Inclusio_Survey"]
collection = db["Survey_enteries"]

# Fetch all docs
docs = list(collection.find({}))

# Convert ObjectId to string to avoid Excel issues
for d in docs:
    d["_id"] = str(d["_id"])

df = pd.DataFrame(docs)
df.to_excel("latest_data.xlsx", index=False)

print("Excel exported successfully!")
