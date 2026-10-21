-- 요양기관 종별 차원
SELECT code, code_nm AS name FROM code_table
WHERE code_type = '종별코드' AND code IN (SELECT DISTINCT cl_cd FROM institution)
ORDER BY code;
