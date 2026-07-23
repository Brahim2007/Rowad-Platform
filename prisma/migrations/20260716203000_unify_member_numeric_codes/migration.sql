-- توحيد رموز جميع الأعضاء إلى أرقام متسلسلة ثابتة من 6 خانات.
-- العلاقات الداخلية تعتمد على beneficiaries.id، لذلك تغيير code لا يؤثر عليها.

CREATE SEQUENCE IF NOT EXISTS beneficiary_code_seq;

-- نقل القيم الحالية مؤقتًا لتجنب أي تصادم مع رموز رقمية موجودة.
UPDATE beneficiaries
SET code = 'legacy-' || id;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "registeredAt" ASC, id ASC) AS member_number
  FROM beneficiaries
)
UPDATE beneficiaries AS beneficiary
SET code = LPAD(ranked.member_number::text, 6, '0')
FROM ranked
WHERE beneficiary.id = ranked.id;

SELECT setval(
  'beneficiary_code_seq',
  GREATEST((SELECT COUNT(*) FROM beneficiaries), 1),
  (SELECT COUNT(*) FROM beneficiaries) > 0
);
