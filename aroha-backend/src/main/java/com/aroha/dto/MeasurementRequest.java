package com.aroha.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

/** Tape measurements in cm; send only the ones taken. */
@Data
public class MeasurementRequest {
    @DecimalMin(value = "40", message = "Waist looks too small: use cm")  @DecimalMax(value = "200", message = "Waist looks too big: use cm")
    private Double waistCm;
    @DecimalMin(value = "20", message = "Neck looks too small: use cm")   @DecimalMax(value = "70", message = "Neck looks too big: use cm")
    private Double neckCm;
    @DecimalMin(value = "50", message = "Hips look too small: use cm")    @DecimalMax(value = "200", message = "Hips look too big: use cm")
    private Double hipCm;
    @DecimalMin(value = "50", message = "Chest looks too small: use cm")  @DecimalMax(value = "200", message = "Chest looks too big: use cm")
    private Double chestCm;
    @DecimalMin(value = "15", message = "Arm looks too small: use cm")    @DecimalMax(value = "70", message = "Arm looks too big: use cm")
    private Double armCm;
    @DecimalMin(value = "60", message = "Shoulders look too small: use cm") @DecimalMax(value = "200", message = "Shoulders look too big: use cm")
    private Double shoulderCm;
    @DecimalMin(value = "25", message = "Thigh looks too small: use cm")  @DecimalMax(value = "100", message = "Thigh looks too big: use cm")
    private Double thighCm;
}
