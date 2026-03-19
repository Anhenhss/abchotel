using System;
using System.ComponentModel.DataAnnotations;

namespace abchotel.Attributes
{
    public class Over18YearsOldAttribute : ValidationAttribute
    {
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            if (value is DateOnly dateOfBirth)
            {
                var today = DateOnly.FromDateTime(DateTime.Today);
                
                if (dateOfBirth > today)
                    return new ValidationResult("Ngày sinh không thể ở tương lai.");

                var age = today.Year - dateOfBirth.Year;
                if (dateOfBirth > today.AddYears(-age)) age--;

                if (age < 18)
                    return new ValidationResult("Khách hàng phải từ 18 tuổi trở lên.");
            }
            return ValidationResult.Success;
        }
    }
}