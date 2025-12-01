from pymongo import MongoClient
import pandas as pd

# MongoDB Atlas connection URI
uri = "mongodb+srv://rafiqmohamed025_db_user:1924CY@cluster0.kxikrnk.mongodb.net/?retryWrites=true&w=majority"

# Connect to MongoDB
client = MongoClient(uri)

# Select database and collection
db = client["Inclusio_Survey"]
collection = db["Survey_enteries"]  # Change to "emails" if you want email list

# Fetch all documents
data = list(collection.find({}))

if not data:
    print("No data found in the collection.")
    exit()

# Convert MongoDB documents to DataFrame
df = pd.DataFrame(data)

# Optional: Remove MongoDB ObjectId column if you don't need it
if "_id" in df.columns:
    df["_id"] = df["_id"].astype(str)  # Or drop with df.drop(columns=["_id"], inplace=True)

# Save to Excel
output_file = "survey_data.xlsx"
df.to_excel(output_file, index=False)

print(f"Data exported successfully to {output_file}")
