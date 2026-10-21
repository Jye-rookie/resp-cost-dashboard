-- 호흡기(J) 청구 큐브: 브라우저에서 기간·상병·서식(외래 031/입원 021)·종별·소득군으로 합산한다.
-- inc: 1~5 = 건강보험료 5분위, M = 의료급여(분위 없음)
SELECT substr(c.recu_fr_dd, 1, 7) AS ym,
       c.fom_tp_cd                AS fom,
       c.main_sick                AS sick,
       i.cl_cd                    AS cl,
       CASE WHEN p.qlf_tp_cd = '3' THEN 'M' ELSE CAST(p.prem_quintile AS TEXT) END AS inc,
       COUNT(*)                   AS n,
       SUM(c.rvd_rpe_tamt_amt)    AS tot,
       SUM(c.rvd_insup_brdn_amt)  AS ins,
       SUM(c.rvd_slf_brdn_amt)    AS slf,
       SUM(c.vst_ddcnt)           AS days
FROM claim c
JOIN institution i USING (yid)
JOIN patient p USING (jid)
WHERE c.main_sick LIKE 'J%'
GROUP BY ym, fom, sick, cl, inc
ORDER BY ym, fom, sick, cl, inc;
