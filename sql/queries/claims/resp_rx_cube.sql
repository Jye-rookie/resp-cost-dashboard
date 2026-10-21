-- 호흡기(J) 청구에 붙은 처방 성분 큐브. lines = 해당 성분이 처방된 청구 수(청구당 성분 1줄)
SELECT substr(c.recu_fr_dd, 1, 7) AS ym,
       c.fom_tp_cd                AS fom,
       c.main_sick                AS sick,
       i.cl_cd                    AS cl,
       r.gnl_cd                   AS gnl,
       COUNT(*)                   AS lines,
       SUM(r.amt)                 AS amt
FROM claim_rx r
JOIN claim c USING (mid)
JOIN institution i USING (yid)
WHERE c.main_sick LIKE 'J%'
GROUP BY ym, fom, sick, cl, gnl
ORDER BY ym, fom, sick, cl, gnl;
