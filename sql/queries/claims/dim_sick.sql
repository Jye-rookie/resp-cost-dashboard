-- 호흡기 상병 차원. grp: 상병 계열(KCD 3단 범위), cdd: 법정감염병 급수(없으면 NULL)
SELECT sickcd AS code,
       CASE sickcd WHEN 'J101' THEN '인플루엔자 (계절성, 확인)'
            ELSE replace(krnm, '상세불명의 ', '') END AS name,
       CASE WHEN substr(sickcd,1,3) BETWEEN 'J00' AND 'J06' THEN '급성 상기도감염'
            WHEN substr(sickcd,1,3) BETWEEN 'J09' AND 'J18' THEN '인플루엔자·폐렴'
            WHEN substr(sickcd,1,3) BETWEEN 'J20' AND 'J22' THEN '급성 하기도감염'
            WHEN substr(sickcd,1,3) BETWEEN 'J30' AND 'J39' THEN '알레르기·만성 상기도'
            WHEN substr(sickcd,1,3) BETWEEN 'J40' AND 'J47' THEN '기관지염·만성 하기도'
            ELSE '기타 호흡기' END AS grp,
       cdd
FROM sick_master
WHERE sickcd IN (SELECT DISTINCT main_sick FROM claim WHERE main_sick LIKE 'J%')
ORDER BY sickcd;
