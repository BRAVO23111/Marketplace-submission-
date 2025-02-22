import pandas as pd
import numpy as np
import json
import sys
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer

def calculate_savings(emissions, product_type):
    # Define ranges for reduction percentages for each product type
    savings_range = {
        't-shirt': (0.05, 0.10),  # 5% to 10% savings
        'bottle': (0.10, 0.15),   # 10% to 15% savings
        'car': (0.15, 0.20),      # 15% to 20% savings
        'laptop': (0.07, 0.12),   # 7% to 12% savings
        'furniture': (0.13, 0.18) # 13% to 18% savings
    }
    
    # Get the savings range for the product type
    min_savings, max_savings = savings_range.get(product_type, (0.05, 0.10))  # Default range if product type not listed

    # Randomly choose a savings percentage within the range
    chosen_savings = np.random.uniform(min_savings, max_savings)
    
    # Calculate the amount of CO2 saved
    savings = emissions * chosen_savings
    return savings

# Get command line arguments
if len(sys.argv) != 3:
    print("Error: Required arguments missing")
    print("Usage: python co2.py <product_type> <model_dir>")
    sys.exit(1)

product_type = sys.argv[1]
model_dir = sys.argv[2]

# Set file paths using the model directory
file_path = os.path.join(model_dir, 'Custom_CO2_Emission_Dataset.csv')
json_path = os.path.join(model_dir, 'emissions_savings.json')

# Load the dataset
data = pd.read_csv(file_path)

# Preprocess the data
categorical_features = ['product_type', 'material_used', 'production_method']
one_hot_encoder = OneHotEncoder()
transformer = ColumnTransformer([
    ("one_hot", one_hot_encoder, categorical_features)
], remainder="passthrough", sparse_threshold=0)

# Transform the data
transformed_data = transformer.fit_transform(data)
feature_names = transformer.get_feature_names_out()
transformed_df = pd.DataFrame(transformed_data, columns=feature_names)

# Define features and target
X = transformed_df.drop('remainder__emissions_kg_CO2e', axis=1)
y = transformed_df['remainder__emissions_kg_CO2e']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Initialize and train the RandomForestRegressor
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Create input DataFrame for prediction
input_df = pd.DataFrame({feature: [0] for feature in feature_names if 'emissions_kg_CO2e' not in feature})
for feature in feature_names:
    if 'product_type' in feature and product_type in feature:
        input_df.at[0, feature] = 1

k = np.random.uniform(1.01, 1.25)
# Predict the emissions
predicted_emissions = model.predict(input_df)[0] * k 
predicted_savings = calculate_savings(predicted_emissions, product_type)

# Prepare data for JSON output
results = {
    "Estimated CO₂ Emissions (kg CO₂e)": float(predicted_emissions),
    "Potential CO₂ Savings (kg CO₂e)": float(predicted_savings)
}

# Print JSON output directly (will be captured by Node.js)
print(json.dumps(results))
