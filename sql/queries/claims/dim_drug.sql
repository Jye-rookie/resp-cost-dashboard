-- 처방 성분 차원. is_abx: 약효분류번호가 611~614, 618(항생물질제제 계열)이면 1.
-- 가정: 식약처 약효분류 61x 중 항생물질 계열로 본 것. 성분이 늘면 이 목록을 점검한다.
SELECT gnl_cd AS gnl, gnl_nm AS name, class_no AS cls, route,
       CASE WHEN class_no IN ('611','612','613','614','618') THEN 1 ELSE 0 END AS is_abx
FROM drug_ingredient
WHERE gnl_cd IN (SELECT DISTINCT gnl_cd FROM claim_rx)
ORDER BY gnl_cd;
