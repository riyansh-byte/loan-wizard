import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from sklearn.preprocessing import LabelEncoder
import pickle
import os

print("Loading dataset...")
df = pd.read_csv("ML/Data/application_train.csv")

FEATURES = [
    'AMT_INCOME_TOTAL',
    'AMT_CREDIT',
    'AMT_ANNUITY',
    'DAYS_EMPLOYED',
    'DAYS_BIRTH',
    'NAME_INCOME_TYPE',
    'NAME_EDUCATION_TYPE',
    'REGION_RATING_CLIENT',
    'CODE_GENDER',
    'EXT_SOURCE_1',
    'EXT_SOURCE_2',
    'EXT_SOURCE_3',
]

TARGET = 'TARGET'

df = df[FEATURES + [TARGET]].copy()
df = df.dropna(subset=[TARGET])

# Encode categoricals
le = LabelEncoder()
for col in ['NAME_INCOME_TYPE', 'NAME_EDUCATION_TYPE', 'CODE_GENDER']:
    df[col] = df[col].fillna('Unknown')
    df[col] = le.fit_transform(df[col].astype(str))

# Fill numeric nulls
df = df.fillna(df.median(numeric_only=True))

X = df[FEATURES]
y = df[TARGET]

print(f"Dataset: {len(df)} rows, {X.shape[1]} features")
print(f"Default rate: {y.mean():.2%}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Training XGBoost model...")
model = XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    use_label_encoder=False,
    eval_metric='auc',
    random_state=42,
    n_jobs=-1
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=50
)

auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])
print(f"\nModel AUC: {auc:.4f}")

os.makedirs("ML", exist_ok=True)
with open("ML/model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model saved to ML/model.pkl")
print("Training complete.")