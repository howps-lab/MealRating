import React, { useState, useRef, ChangeEvent } from 'react';
import {
  UtensilsCrossed,
  DollarSign,
  MapPin,
  Star,
  Calendar,
  Camera,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  RotateCcw,
  Plus
} from 'lucide-react';
import { MealRating } from '../types/meal';
import { getTodayIsoDate, formatDisplayDate, isoToMonthYear } from '../lib/dateUtils';
import { uploadMealPhotoService, createMealService } from '../lib/supabase';

interface AddMealFormProps {
  onMealAdded: (newMeal: MealRating, targetMonth: string) => void;
  currentSelectedMonth: string;
}

interface FormErrors {
  description?: string;
  amount?: string;
  location?: string;
  rating?: string;
  date?: string;
  photo?: string;
  general?: string;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: '1 - Poor (Disappointing taste)',
  2: '2 - Fair (Could be better)',
  3: '3 - Good (Satisfying meal)',
  4: '4 - Very Good (Delicious & flavorful!)',
  5: '5 - Excellent! (Outstanding culinary treat!)',
};

// Canvas image compressor to optimize large uploads under 5MB
async function compressImage(file: File, maxDimension = 1600, quality = 0.85): Promise<File> {
  // If small file, no compression needed
  if (file.size < 600 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export const AddMealForm: React.FC<AddMealFormProps> = ({ onMealAdded }) => {
  // Field values
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [mealDate, setMealDate] = useState<string>(getTodayIsoDate());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Hover state for interactive stars
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // States
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // File input refs
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Check if form contains user entered data
  const hasUserEnteredData = Boolean(
    description.trim() ||
    amount.trim() ||
    location.trim() ||
    rating !== null ||
    photoFile !== null ||
    mealDate !== getTodayIsoDate()
  );

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Description
    if (!description.trim()) {
      newErrors.description = 'Please enter a meal description or dish name.';
    }

    // 2. Amount: numeric, > 0, max 2 decimals
    const trimmedAmount = amount.trim();
    if (!trimmedAmount) {
      newErrors.amount = 'Please enter the meal amount.';
    } else {
      const num = Number(trimmedAmount);
      if (isNaN(num)) {
        newErrors.amount = 'Amount must be a valid number.';
      } else if (num <= 0) {
        newErrors.amount = 'Amount must be greater than S$ 0.00.';
      } else if (!/^\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
        newErrors.amount = 'Amount cannot have more than two decimal places.';
      }
    }

    // 3. Location
    if (!location.trim()) {
      newErrors.location = 'Please specify the restaurant, cafe, or food centre.';
    }

    // 4. Rating
    if (rating === null || rating < 1 || rating > 5) {
      newErrors.rating = 'Please rate your meal by selecting 1 to 5 stars.';
    }

    // 5. Date
    if (!mealDate) {
      newErrors.date = 'Please pick a valid meal date.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file selection (Gallery or Camera)
  const handlePhotoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous photo error
    setErrors((prev) => ({ ...prev, photo: undefined }));

    // Accepted formats: jpeg, png, webp
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!acceptedTypes.includes(file.type.toLowerCase())) {
      setErrors((prev) => ({
        ...prev,
        photo: 'Invalid image format. Please upload JPEG, PNG, or WebP.',
      }));
      return;
    }

    // Limit file size to 5 MB (5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        photo: 'File size exceeds 5 MB. Please select a smaller photo.',
      }));
      return;
    }

    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const handleRemovePhoto = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrors((prev) => ({ ...prev, photo: undefined }));
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Clear all handler
  const executeClearAll = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setDescription('');
    setAmount('');
    setLocation('');
    setRating(null);
    setHoverRating(null);
    setMealDate(getTodayIsoDate());
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrors({});
    setSuccessMessage(null);
    setShowClearConfirm(false);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleClearAllClick = () => {
    if (hasUserEnteredData) {
      setShowClearConfirm(true);
    } else {
      executeClearAll();
    }
  };

  // Submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      let finalPhotoUrl: string | null = null;

      // 1. Upload photo if selected
      if (photoFile) {
        const compressedFile = await compressImage(photoFile);
        const uploadResult = await uploadMealPhotoService(compressedFile);
        finalPhotoUrl = uploadResult.url;
      }

      // 2. Insert meal into database
      const cleanDescription = description.trim();
      const cleanLocation = location.trim();
      const parsedAmount = parseFloat(parseFloat(amount.trim()).toFixed(2));
      const cleanRating = rating!;

      const result = await createMealService({
        description: cleanDescription,
        amount: parsedAmount,
        location: cleanLocation,
        rating: cleanRating,
        meal_date: mealDate,
        photo_url: finalPhotoUrl,
      });

      // 3. Success handling
      const targetMonth = isoToMonthYear(mealDate);
      onMealAdded(result.data, targetMonth);

      // Show success feedback
      setSuccessMessage(
        `"${cleanDescription}" has been recorded! (${cleanRating} ★ · S$ ${parsedAmount.toFixed(2)})`
      );

      // Reset form fields
      setDescription('');
      setAmount('');
      setLocation('');
      setRating(null);
      setHoverRating(null);
      setMealDate(getTodayIsoDate());
      setPhotoFile(null);
      setPhotoPreview(null);
      setErrors({});

      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } catch (err: unknown) {
      console.error('Failed to save meal:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save meal. Please try again.';
      setErrors((prev) => ({ ...prev, general: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <section id="add-meal-section" className="scroll-mt-24 mb-16">
      <div className="bg-white border-2 border-amber-200/90 rounded-3xl p-5 sm:p-8 shadow-md shadow-amber-100/50 relative overflow-hidden">
        {/* Subtle background flair */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-amber-100/40 via-orange-50/20 to-transparent -mr-20 -mt-20 pointer-events-none rounded-full" />

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 border-b border-amber-100/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-300/40">
              <UtensilsCrossed className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F1E36] tracking-tight">
                Rate Your Latest Meal
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Log every dish, give your honest stars, and track your food spending.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Easy Entry
          </span>
        </div>

        {/* General Error Banner */}
        {errors.general && (
          <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-medium">{errors.general}</div>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 animate-in fade-in duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm font-medium">
              <p className="font-bold">Meal Saved Successfully!</p>
              <p className="text-emerald-700 mt-0.5">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg"
              aria-label="Dismiss success message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Field 1: Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="field-description" className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                1. Meal Description <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-medium text-slate-400">e.g. Dish name or specialty</span>
            </div>
            <div className="relative">
              <input
                id="field-description"
                type="text"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
                }}
                placeholder="e.g. Grilled Salmon with Vegetables"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-[#FAF8F5] text-[#0F1E36] placeholder:text-slate-400 transition-all focus:bg-white focus:outline-hidden focus:ring-2 ${
                  errors.description
                    ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                    : 'border-amber-200 focus:ring-amber-400 focus:border-amber-400'
                }`}
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Grid row for Amount & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Field 2: Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="field-amount" className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                  2. Amount (SGD) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-medium text-slate-400">Up to 2 decimals</span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-500 font-bold font-mono text-sm">
                  <span>S$</span>
                </div>
                <input
                  id="field-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                  }}
                  placeholder="0.00"
                  className={`w-full pl-11 pr-3.5 py-2.5 rounded-xl border text-sm font-bold font-mono tabular-nums bg-[#FAF8F5] text-[#0F1E36] placeholder:text-slate-400 transition-all focus:bg-white focus:outline-hidden focus:ring-2 ${
                    errors.amount
                      ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-amber-200 focus:ring-amber-400 focus:border-amber-400'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Field 3: Location */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="field-location" className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                  3. Location / Restaurant <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-medium text-slate-400">Where you ate</span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-amber-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="field-location"
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
                  }}
                  placeholder="e.g. Restaurant name or food centre"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-medium bg-[#FAF8F5] text-[#0F1E36] placeholder:text-slate-400 transition-all focus:bg-white focus:outline-hidden focus:ring-2 ${
                    errors.location
                      ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-amber-200 focus:ring-amber-400 focus:border-amber-400'
                  }`}
                />
              </div>
              {errors.location && (
                <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.location}
                </p>
              )}
            </div>
          </div>

          {/* Grid row for Rating & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Field 4: Rating */}
            <div className="bg-[#FAF8F5] border border-amber-200/70 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                  4. Rating (1 to 5 Stars) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-bold text-amber-800">
                  {rating !== null ? `${rating} / 5` : 'No rating chosen'}
                </span>
              </div>

              {/* Interactive Star Buttons */}
              <div
                className="flex items-center gap-2 py-1"
                role="radiogroup"
                aria-label="Select meal rating from 1 to 5 stars"
              >
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isHighlighted = (activeDisplayRating || 0) >= starValue;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      role="radio"
                      aria-checked={rating === starValue}
                      aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
                      tabIndex={0}
                      onClick={() => {
                        setRating(starValue);
                        if (errors.rating) setErrors((prev) => ({ ...prev, rating: undefined }));
                      }}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setRating(starValue);
                          if (errors.rating) setErrors((prev) => ({ ...prev, rating: undefined }));
                        }
                      }}
                      className="p-1 rounded-lg hover:scale-120 focus:scale-120 focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-all cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          isHighlighted
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-slate-300 fill-slate-100 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Rating Description Label */}
              <div className="mt-2 text-xs font-semibold text-amber-900 min-h-[1.25rem]">
                {activeDisplayRating
                  ? RATING_DESCRIPTIONS[activeDisplayRating]
                  : 'Click on a star to set your rating'}
              </div>

              {errors.rating && (
                <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.rating}
                </p>
              )}
            </div>

            {/* Field 5: Date */}
            <div className="bg-[#FAF8F5] border border-amber-200/70 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="field-date" className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                  5. Meal Date <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-bold text-amber-800">
                  {formatDisplayDate(mealDate)}
                </span>
              </div>

              <div className="relative flex items-center mt-1">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-amber-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  id="field-date"
                  type="date"
                  value={mealDate}
                  onChange={(e) => {
                    setMealDate(e.target.value);
                    if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                  }}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-medium bg-white text-[#0F1E36] transition-all focus:outline-hidden focus:ring-2 cursor-pointer ${
                    errors.date
                      ? 'border-rose-300 focus:ring-rose-400'
                      : 'border-amber-200 focus:ring-amber-400 focus:border-amber-400'
                  }`}
                />
              </div>

              <p className="text-[11px] font-medium text-slate-500 mt-2">
                Displayed everywhere as <span className="font-semibold text-slate-700">dd MMM yyyy</span> (e.g. {formatDisplayDate(mealDate)})
              </p>

              {errors.date && (
                <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.date}
                </p>
              )}
            </div>
          </div>

          {/* Field 6: Meal Photo Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                6. Meal Photograph <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                JPEG, PNG, WebP · Max 5 MB
              </span>
            </div>

            {/* Hidden file inputs: gallery vs camera */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handlePhotoFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoFileChange}
              className="hidden"
            />

            {!photoPreview ? (
              <div className="border-2 border-dashed border-amber-200 rounded-2xl p-5 bg-[#FAF8F5] text-center hover:bg-amber-50/40 transition-colors">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {/* Select from device gallery button */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-amber-300 hover:border-amber-400 text-slate-800 text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-amber-600" />
                    Upload from Device
                  </button>

                  <span className="text-xs font-bold text-slate-400">or</span>

                  {/* Take photo directly using mobile camera button */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo with Camera
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 mt-2.5">
                  Snap food on mobile rear camera or select any saved picture.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-3.5 bg-amber-50/50 border border-amber-200 rounded-2xl">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-amber-200 shadow-xs shrink-0">
                  <img
                    src={photoPreview}
                    alt="Uploaded meal preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Photo ready to upload</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">
                    {photoFile?.name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {photoFile ? `${(photoFile.size / 1024).toFixed(0)} KB` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0 cursor-pointer"
                  title="Remove selected photo"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            )}

            {errors.photo && (
              <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.photo}
              </p>
            )}
          </div>

          {/* Form Action Buttons: Add & Clear All */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-amber-100">
            {/* Clear All Button */}
            <button
              type="button"
              onClick={handleClearAllClick}
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              Clear All
            </button>

            {/* Add Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:to-amber-600 text-white text-sm sm:text-base font-extrabold shadow-md shadow-orange-200 transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Meal to Database...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  Add Meal Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog for Clear All if form has user data */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-amber-100 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-base font-bold text-[#0F1E36]">
              Clear entered meal data?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              You have entered details into the form. Are you sure you want to reset all fields? Saved records will not be affected.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={executeClearAll}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
              >
                Yes, Clear Form
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
