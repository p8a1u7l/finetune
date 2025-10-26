# FT Dataset Generator (Multi-Symbol)

이 프로젝트는 바이낸스 현물(spot) 마켓의 캔들, 체결, 호가 데이터를 수집하고, 기술적 지표·오더플로우 기반 의사결정 로직을 통해 파인튜닝 학습용 JSONL 코퍼스를 생성하는 TypeScript 기반 도구입니다.

## 1. 사전 준비

1. **환경 변수 설정**
   - `.env.example`를 `.env`로 복사한 뒤 원하는 심볼과 파라미터를 설정합니다.
   - 기본값은 BTCUSDT, ETHUSDT, SOLUSDT 등 다중 심볼 처리가 가능하며, `SYMBOLS` 항목에 콤마로 구분해 입력합니다.
   - 기타 인터벌, 데이터 수량, 지표 파라미터, 증강 옵션 등을 필요에 맞게 조정합니다.

2. **의존성 설치**
   ```bash
   npm install
   ```

## 2. 빌드 및 실행

1. **TypeScript 빌드**
   ```bash
   npm run build
   ```

2. **데이터 생성 파이프라인 실행**
   - 지정된 모든 심볼에 대해 원시 JSONL을 생성하고 학습/검증 세트로 분리합니다.
   ```bash
   npm run all
   ```

3. **개별 단계 실행(선택)**
   - 원시 데이터 생성만 수행: `npm run gen`
   - 기존 원시 데이터 기반으로 train/val 분리만 수행: `npm run split`

## 3. 출력 구조

- `out/<SYMBOL>_raw.jsonl`: 각 심볼별 메시지-페어 형태의 데이터셋.
- `out/train.jsonl`, `out/val.jsonl`: 무작위 셔플 후 지정된 검증 비율(`VAL_RATIO`)에 따라 분리된 최종 코퍼스.

## 4. 구성 파일 요약

- `config.ts`: 환경 변수 로딩 및 파라미터 구성.
- `binance.ts`: 바이낸스 REST API 호출(캔들, 집계체결, 호가).
- `indicators.ts`: EMA, RSI, ATR, 롤링 볼륨 프로파일, FVG 계산.
- `orderflow.ts`: CVD 및 테이커 비율 계산.
- `logic.ts`: 지표/마이크로구조 기반 의사결정 로직.
- `augment.ts`: 자연어 설명, 부정 샘플 생성.
- `jsonl.ts`: 메시지 포맷 구성 및 JSONL 파일 작성.
- `pipeline.ts`: 전체 데이터 수집 및 의사결정 파이프라인.
- `cli.ts`: CLI 엔트리포인트(생성/분리 명령).

## 5. 문제 해결 가이드

- **네트워크 실패**: `axios` 요청이 실패할 경우, Binance API 접근이 제한되었거나 네트워크 문제가 있는지 확인합니다.
- **Rate Limit**: 심볼 수가 많거나 호출 빈도가 높으면 바이낸스 API 제한에 걸릴 수 있습니다. 필요 시 `LIMIT` 값을 조정하거나 호출 간 지연을 도입하세요.
- **출력 폴더 미존재**: 스크립트가 자동으로 생성하지만, 권한 문제가 있다면 수동으로 `out/` 디렉터리를 생성해 주세요.

## 6. 테스트

- 타입 검사/컴파일: `npm run build`
- 데이터 파이프라인 검증: `npm run all`

빌드 및 실행 과정에서 오류가 발생하면 위 문제 해결 가이드를 참고하거나 `.env` 설정을 재검토하세요.

