# 데이터 사전 (요약)
상세 컬럼 주석은 data/raw/01_setup.sql 의 CREATE TABLE 참고.

## kr_claims (가상, 2024-01 ~ 2025-12)
claim(38,375) —jid→ patient(3,000) / —yid→ institution(2,184) / —main_sick→ sick_master(21,299)
claim —mid→ claim_sick(39,892), claim_rx(60,146) —gnl_cd→ drug_ingredient(20,114)
code_table(진료과목·종별·서식구분 등), sido_code(시도→권역), hospital_open(독립)

## kr_lung_cancer (합성, 단일 병원)
lung_pt_bsnf(9,897) —pt_sbst_no→ lung_trtm_casb(36,567), lung_trtm_rd(4,312), lung_oprt_nfrm(3,463), lung_dead_nfrm(3,959)

## 주의
생존일수 음수 / 성별 전부 M / cstr_nt 대부분 NULL / 병기 'x' 미상

## 대시보드 지표 정의 (호흡기 격차 모니터)
- 호흡기 = 주상병 J코드(16종). 외래 031 / 입원 021 구분. 격차 분석은 외래 기준.
- 1건당 금액 = 합계 ÷ 청구(명세서) 건수. 중앙값은 큐브 구조상 제공하지 않음.
- 소득군: 건강보험료 5분위(1~5), 의료급여(M). 분위의 높고 낮음 방향은 원본 주석에 없어 표기하지 않음.
- 항생제 처방률 = 항생제 성분 처방 청구 수 ÷ 청구 수. 항생제 = 약효분류번호 611~614, 618 (sql/queries/claims/dim_drug.sql, 가정).
- 큐브: resp_cube(청구), resp_rx_cube(처방) — 필터 차원을 열로 가진 group by 결과를 브라우저에서 합산.
- 한계: 청구·환자·기관은 가상 데이터. 소득 분위 간 격차가 설계돼 있지 않고 항생제 처방률이 상병과 무관하게 거의 일정(약 37~44%).
