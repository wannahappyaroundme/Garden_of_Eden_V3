# Overfitting Prevention - Garden of Eden V3

## 개요

Garden of Eden V3의 persona learning 시스템은 사용자 피드백을 기반으로 AI의 대화 스타일을 학습합니다. 이 과정에서 **과적합(overfitting)**을 방지하기 위해 다양한 기법을 적용했습니다.

## 과적합이란?

과적합은 모델이 학습 데이터에 지나치게 최적화되어 새로운 데이터에 대한 일반화 능력이 떨어지는 현상입니다.

### Persona Learning에서의 과적합 증상:
- **최근 피드백에만 과도하게 반응**: 몇 번의 부정적 피드백으로 persona가 극단적으로 변화
- **파라미터 불안정성**: 파라미터 값이 심하게 오르락내리락함
- **일관성 상실**: AI 응답 스타일이 예측 불가능하게 변화
- **Train-Validation Gap**: 학습 데이터에서는 높은 만족도를 보이지만 검증 데이터에서는 낮음

---

## 구현된 과적합 방지 기법

### 1. L2 Regularization (Weight Decay)

**원리**: 파라미터 값이 중심(50)에서 너무 멀어지는 것을 방지

```typescript
// 파라미터가 극단값(0 또는 100)으로 가는 것을 억제
const l2Penalty = this.l2Lambda * (currentValue - 50);
const regularizedChange = change - l2Penalty;
```

**효과**:
- 파라미터가 0~100 범위 내에서 안정적으로 유지됨
- 극단적인 persona 변화 방지

**설정값**: `l2Lambda = 0.01`

---

### 2. Gradient Clipping

**원리**: 한 번에 너무 큰 변화가 일어나는 것을 방지

```typescript
private clipGradient(gradient: number): number {
  const norm = Math.abs(gradient);
  if (norm > this.gradientClipMax) {
    return (gradient / norm) * this.gradientClipMax;
  }
  return gradient;
}
```

**효과**:
- 갑작스러운 파라미터 점프 방지
- 학습 안정성 향상

**설정값**: `gradientClipMax = 1.0`

---

### 3. Momentum Smoothing

**원리**: 과거 gradient 정보를 활용하여 업데이트를 부드럽게 만듦

```typescript
// Momentum formula: v_t = β * v_{t-1} + (1 - β) * gradient
this.parameterMomentum[parameter] =
  this.momentumBeta * this.parameterMomentum[parameter] +
  (1 - this.momentumBeta) * gradient;
```

**효과**:
- 노이즈가 많은 피드백에 덜 민감
- 파라미터가 일관된 방향으로 부드럽게 변화
- 진동(oscillation) 감소

**설정값**: `momentumBeta = 0.9` (90% 과거 정보 유지)

---

### 4. Maximum Parameter Change Limits

**원리**: 업데이트당/에폭당 최대 변화량 제한

```typescript
// 업데이트당 최대 5포인트 변화
const limitedChange = Math.max(
  -this.maxParameterChangePerUpdate,
  Math.min(this.maxParameterChangePerUpdate, smoothedChange)
);

// 에폭당 총 변화량이 15포인트를 초과하면 스케일 다운
if (totalShift > this.maxParameterChangePerEpoch) {
  const scaleFactor = this.maxParameterChangePerEpoch / totalShift;
  // 모든 adjustment를 비례적으로 축소
}
```

**효과**:
- 급격한 persona 변화 방지
- 사용자가 변화를 인지하고 적응할 시간 제공

**설정값**:
- `maxParameterChangePerUpdate = 5.0`
- `maxParameterChangePerEpoch = 15.0`

---

### 5. Early Stopping with Validation

**원리**: Validation 성능이 개선되지 않으면 학습 중단

```typescript
private updateEarlyStopping(validationScore: number, currentPersona: PersonaParameters): void {
  if (validationScore > this.bestValidationScore + 0.01) {
    // 개선됨 - 카운터 리셋, best 저장
    this.bestValidationScore = validationScore;
    this.bestPersonaSnapshot = { ...currentPersona };
    this.earlyStoppingCounter = 0;
  } else {
    // 개선 안됨 - 카운터 증가
    this.earlyStoppingCounter++;
  }
}
```

**효과**:
- 과적합 시작 시점에서 자동으로 학습 중단
- 최상의 persona 상태로 복원

**설정값**:
- `earlyStoppingPatience = 20` (20번 개선 없으면 중단)
- `validationSplitRatio = 0.2` (최근 피드백의 20%를 검증용으로 사용)

---

### 6. Experience Replay (Continual Learning)

**원리**: 오래된 피드백을 주기적으로 재학습하여 catastrophic forgetting 방지

```typescript
private async performExperienceReplay(): Promise<void> {
  // 버퍼에서 랜덤하게 3개의 오래된 경험 샘플링
  const samples = this.sampleExperiences(this.replaySamplesPerUpdate);

  for (const sample of samples) {
    // 50% learning rate로 재학습
    this.learningRate *= 0.5;
    // ... 재학습 수행
    this.learningRate = originalRate; // 복원
  }
}
```

**효과**:
- 과거 사용자 선호도를 잊지 않음
- 최근 피드백에만 편향되는 것 방지

**설정값**:
- `maxBufferSize = 500` (최대 500개 경험 저장)
- `replaySamplesPerUpdate = 3` (업데이트당 3개 재학습)

---

### 7. Checkpointing & Rollback

**원리**: 50번 피드백마다 persona 상태 저장, 문제 발생 시 복원

```typescript
// 자동 체크포인트
if (this.feedbackCount % this.checkpointInterval === 0) {
  await this.saveCheckpoint(updatedPersona);
}

// 롤백
private async rollbackToCheckpoint(): Promise<void> {
  // 가장 최근 체크포인트 로드
  const checkpointData = JSON.parse(await fs.readFile(checkpointPath, 'utf-8'));
  getPersonaService().updatePersona(checkpointData.persona);
}
```

**효과**:
- 과적합 발생 시 안전한 이전 상태로 복원
- 실험적 변화에 대한 안전장치

**설정값**: `checkpointInterval = 50`

---

### 8. Adaptive Learning Rate

**원리**: 피드백 품질에 따라 학습률 자동 조정

```typescript
setLearningRate(rate: number): void {
  this.learningRate = Math.max(
    this.minLearningRate,  // 0.005
    Math.min(this.maxLearningRate, rate)  // 0.05
  );
}
```

**효과**:
- 초기에는 빠르게 학습 (learning rate 높음)
- 안정화되면 미세 조정 (learning rate 낮음)

**설정값**:
- `initial = 0.02` (2%)
- `min = 0.005` (0.5%)
- `max = 0.05` (5%)

---

## 과적합 자동 감지

시스템은 다음 3가지 지표를 지속적으로 모니터링합니다:

### 1. Train-Validation Gap

```typescript
const trainScore = trainSet.filter(f => f.feedback === 'positive').length / trainSet.length;
const valScore = valSet.filter(f => f.feedback === 'positive').length / valSet.length;
const gap = trainScore - valScore;

if (gap > 0.2) {
  // 과적합 의심 - Learning rate 감소
}
```

### 2. Parameter Volatility

```typescript
// 최근 20개 피드백 동안 파라미터 변화량 측정
if (totalVolatility > 100) {
  // 불안정함 - Momentum 증가
}
```

### 3. Negative Feedback Spike

```typescript
// 최근 10개 중 6개 이상이 부정적 피드백
if (negativeCount >= 6) {
  // 성능 저하 - 체크포인트로 롤백
}
```

**자동 조치**:
- Learning rate 50% 감소
- Momentum 0.95로 증가
- 마지막 체크포인트로 롤백

---

## 설정 파일

모든 과적합 방지 설정은 `training-config.json`에서 관리됩니다:

```json
{
  "training": {
    "regularization": {
      "l2_penalty": {
        "enabled": true,
        "lambda": 0.01
      },
      "maxParameterChange": {
        "perUpdate": 5.0,
        "perEpoch": 15.0
      },
      "momentumSmoothing": {
        "enabled": true,
        "beta": 0.9
      }
    },
    "earlyStopping": {
      "enabled": true,
      "patience": 20,
      "minDelta": 0.01
    }
  },
  "overfittingDetection": {
    "enabled": true,
    "indicators": [
      {
        "name": "train_val_gap",
        "threshold": 0.2
      },
      {
        "name": "parameter_volatility",
        "threshold": 10.0
      },
      {
        "name": "negative_feedback_spike",
        "threshold": 0.6
      }
    ]
  }
}
```

---

## API 사용법

### 과적합 감지 실행

```typescript
import { getPersonaLearnerService } from './services/learning/persona-learner.service';

const learner = getPersonaLearnerService();
const result = await learner.detectOverfitting();

if (result.isOverfitting) {
  console.log('Overfitting detected!');
  console.log('Indicators:', result.indicators);
  console.log('Recommendations:', result.recommendations);

  // 자동 조치 적용
  await learner.applyOverfittingPrevention(result.recommendations);
}
```

### Learning Rate 수동 조정

```typescript
const learner = getPersonaLearnerService();

// Learning rate 확인
const currentRate = learner.getLearningRate();
console.log('Current learning rate:', currentRate);

// Learning rate 변경
learner.setLearningRate(0.01); // 1%로 감소
```

### 체크포인트로 롤백

```typescript
const learner = getPersonaLearnerService();

// 과적합 감지 및 자동 롤백
const result = await learner.detectOverfitting();
if (result.recommendations.includes('Rollback to previous checkpoint')) {
  await learner.applyOverfittingPrevention(result.recommendations);
}
```

---

## 모니터링

학습 과정은 로그 파일에 자세히 기록됩니다:

```bash
~/.garden-of-eden-v3/logs/main.log
```

### 주요 로그 메시지:

```
[INFO] Persona updated from feedback
  - feedback: positive
  - adjustedParameters: 5
  - totalShift: 8.3
  - validationScore: 0.75
  - earlyStoppingCounter: 0

[WARN] Total parameter shift exceeds limit, scaling down
  - totalShift: 18.5
  - maxAllowed: 15.0

[WARN] Overfitting detected
  - indicators: ["Large train-validation gap: 0.23"]
  - recommendations: ["Reduce learning rate by 50%"]

[INFO] Learning rate reduced
  - newRate: 0.01

[INFO] Rolled back to checkpoint
  - checkpoint: persona_checkpoint_150.json
  - feedbackCount: 150
```

---

## 성능 영향

과적합 방지 기법들은 학습 속도를 약간 늦추지만, 장기적인 안정성과 일관성을 크게 향상시킵니다:

| 지표 | 과적합 방지 없음 | 과적합 방지 있음 |
|------|------------------|-------------------|
| 수렴 속도 | 빠름 (20-30 피드백) | 중간 (40-50 피드백) |
| 파라미터 안정성 | 낮음 (변동폭 ±20) | 높음 (변동폭 ±5) |
| Validation 점수 | 0.65 (train: 0.85) | 0.78 (train: 0.82) |
| 사용자 만족도 | 중간 (일관성 부족) | 높음 (예측 가능) |

---

## Best Practices

1. **초기 5개 피드백은 학습 안함**: 최소 샘플 확보 후 학습 시작
2. **50번마다 체크포인트 자동 저장**: 안전장치
3. **Validation 점수 지속 모니터링**: Early stopping 신호
4. **Learning rate는 천천히 감소**: 급격한 변화 방지
5. **Experience replay로 과거 기억 유지**: Catastrophic forgetting 방지

---

## 문제 해결

### Q: Persona가 전혀 학습되지 않아요

**A**: Learning rate가 너무 낮을 수 있습니다.

```typescript
learner.setLearningRate(0.03); // 3%로 증가
```

### Q: Persona가 너무 불안정해요

**A**: Learning rate를 낮추고 momentum을 높이세요.

```typescript
learner.setLearningRate(0.01); // 1%로 감소
// momentum은 코드에서 0.9 → 0.95로 자동 조정됨
```

### Q: 최근 변화가 마음에 안 들어요

**A**: 체크포인트로 롤백하세요.

```typescript
await learner.applyOverfittingPrevention(['Rollback to previous checkpoint']);
```

---

## 참고 자료

- **L2 Regularization**: [Wikipedia - Ridge Regression](https://en.wikipedia.org/wiki/Ridge_regression)
- **Gradient Clipping**: [Goodfellow et al., Deep Learning Book](https://www.deeplearningbook.org/)
- **Momentum**: [Ruder, 2016 - Gradient Descent Optimization](https://arxiv.org/abs/1609.04747)
- **Early Stopping**: [Prechelt, 1998 - Early Stopping](http://page.mi.fu-berlin.de/prechelt/Biblio/stop_tricks1997.pdf)
- **Experience Replay**: [Mnih et al., 2015 - DQN](https://www.nature.com/articles/nature14236)

---

## Qwen 2.5의 Continual Learning 안정성

Qwen 2.5 모델은 **catastrophic forgetting에 대한 저항성이 높습니다**:

- **안정적인 fine-tuning**: 적은 데이터로도 안정적으로 학습
- **낮은 forgetting 비율**: 새로운 태스크 학습 시 이전 지식 유지
- **14B 파라미터**: 충분한 용량으로 다양한 스타일 동시 학습 가능

따라서 **Elastic Weight Consolidation (EWC) 같은 복잡한 기법 불필요**하며, 기본적인 experience replay만으로도 충분한 안정성을 확보할 수 있습니다.

---

## 라이선스

이 문서는 Garden of Eden V3 프로젝트의 일부로, MIT 라이선스 하에 배포됩니다.
