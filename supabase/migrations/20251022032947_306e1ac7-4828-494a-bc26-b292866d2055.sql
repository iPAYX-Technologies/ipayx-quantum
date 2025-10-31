-- Assign admin role to the main user
INSERT INTO public.user_roles (user_id, role)
VALUES ('65b191df-c7bb-48dd-ac36-fb7cee0437d6', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;