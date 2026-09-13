async def process_correction(
    self,
    user_id: int,
    original: str,
    corrected: str,
    language: str,
    transcription_id: Optional[int] = None
) -> Dict[str, Any]:

    pattern_key = self._generate_pattern_key(
        original,
        corrected,
        language
    )

    existing_pattern = (
        self.db.query(AdaptivePattern)
        .filter(
            AdaptivePattern.user_id == user_id,
            AdaptivePattern.pattern_key == pattern_key
        )
        .first()
    )

    if existing_pattern:
        existing_pattern.frequency += 1

        existing_pattern.confidence = min(
            1.0,
            existing_pattern.confidence + 0.05
        )

        existing_pattern.last_used = datetime.utcnow()

    else:
        new_pattern = AdaptivePattern(
            user_id=user_id,
            pattern_key=pattern_key,
            original=original,
            corrected=corrected,
            language=language,
            frequency=1,
            confidence=0.6,
            last_used=datetime.utcnow()
        )

        self.db.add(new_pattern)

    correction = Correction(
        user_id=user_id,
        transcription_id=transcription_id,
        original_text=original,
        corrected_text=corrected,
        language=language
    )

    self.db.add(correction)

    if transcription_id:

        transcription = (
            self.db.query(Transcription)
            .filter(
                Transcription.id == transcription_id,
                Transcription.user_id == user_id
            )
            .first()
        )

        if transcription:
            transcription.was_corrected = True

    self.db.commit()

    return {
        "success": True,
        "frequency": (
            existing_pattern.frequency
            if existing_pattern
            else 1
        ),
        "confidence": (
            existing_pattern.confidence
            if existing_pattern
            else 0.6
        )
    }