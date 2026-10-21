// data/<db>/<name>.json 로더. 모든 차트는 이 함수로만 데이터를 읽는다.
export async function loadData(db, name) {
  const res = await fetch(`data/${db}/${name}.json`);
  if (!res.ok) throw new Error(`데이터 로드 실패: ${db}/${name}`);
  return res.json();
}
