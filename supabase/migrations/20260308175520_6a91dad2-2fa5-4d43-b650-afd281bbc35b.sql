
ALTER TABLE profiles DISABLE TRIGGER protect_financial_fields;
UPDATE profiles SET wallet_balance = 200 WHERE user_id = '651d4c36-2166-416d-a819-4937666fd8cd';
ALTER TABLE profiles ENABLE TRIGGER protect_financial_fields;
