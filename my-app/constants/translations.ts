/**
 * constants/translations.ts
 *
 * Multi-Language Localization Dictionaries for the Multi-Brand Tours Platform.
 * Supports:
 *   - en: English (Global Default)
 *   - gu: Gujarati (ગુજરાતી) — Recommended for GujjuTours
 *   - hi: Hindi (हिन्दी) — Pan-India Regional Travel
 *   - th: Thai (ภาษาไทย) — Recommended for TripGoAsia
 *   - vi: Vietnamese (Tiếng Việt) — Southeast Asian Expeditions
 *   - ar: Arabic (العربية) — Recommended for Technoheaven Luxury
 *
 * Full strict typing with zero `any`.
 */

export type LanguageCode = 'en' | 'gu' | 'hi' | 'th' | 'vi' | 'ar';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  recommendedBrand?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🌐',
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    flag: '🇮🇳',
    recommendedBrand: 'gujjutours',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
  },
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ภาษาไทย',
    flag: '🇹🇭',
    recommendedBrand: 'tripgoasia',
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    recommendedBrand: 'tripgoasia',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇦🇪',
    recommendedBrand: 'technoheaven',
  },
];

export interface TranslationDictionary {
  // Navigation & Tabs
  nav_home: string;
  nav_explore: string;
  nav_bookings: string;
  nav_wishlist: string;
  nav_profile: string;

  // Common Actions
  action_search: string;
  action_book_now: string;
  action_view_details: string;
  action_share: string;
  action_save: string;
  action_saved: string;
  action_cancel: string;
  action_confirm: string;
  action_back: string;
  action_retry: string;
  action_filter: string;
  action_sort: string;
  action_apply: string;
  action_reset: string;

  // Home Screen
  home_welcome: string;
  home_tagline: string;
  home_featured_tours: string;
  home_popular_destinations: string;
  home_categories: string;
  home_view_all: string;
  home_upcoming_trip: string;

  // Tour Details
  tour_overview: string;
  tour_itinerary: string;
  tour_reviews: string;
  tour_highlights: string;
  tour_included: string;
  tour_excluded: string;
  tour_per_person: string;
  tour_duration: string;
  tour_rating: string;
  tour_group_size: string;
  tour_best_time: string;
  tour_similar_tours: string;
  tour_write_review: string;
  tour_packing_checklist: string;

  // Booking & E-Ticket
  booking_e_ticket: string;
  booking_confirmed: string;
  booking_reference: string;
  booking_travel_date: string;
  booking_travelers: string;
  booking_total_paid: string;
  booking_scan_prompt: string;
  booking_share_pass: string;
  booking_cancel_reservation: string;
  booking_no_reservations: string;

  // Profile & Settings
  profile_title: string;
  profile_passenger_pass: string;
  profile_preferences: string;
  profile_language: string;
  profile_currency: string;
  profile_notifications: string;
  profile_concierge_support: string;
  profile_sign_in: string;
  profile_sign_out: string;

  // Offline & Notifications
  offline_mode_active: string;
  back_online: string;
  notifications_title: string;
  departure_reminder: string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    nav_home: 'Home',
    nav_explore: 'Explore',
    nav_bookings: 'Bookings',
    nav_wishlist: 'Wishlist',
    nav_profile: 'Profile',

    action_search: 'Search tours & destinations...',
    action_book_now: 'Book Experience',
    action_view_details: 'View Details',
    action_share: 'Share',
    action_save: 'Save',
    action_saved: 'Saved',
    action_cancel: 'Cancel',
    action_confirm: 'Confirm',
    action_back: 'Back',
    action_retry: 'Retry',
    action_filter: 'Filters',
    action_sort: 'Sort By',
    action_apply: 'Apply Filters',
    action_reset: 'Reset',

    home_welcome: 'Find Your Next Journey',
    home_tagline: 'Curated boutique travel and bespoke expeditions',
    home_featured_tours: 'Featured Experiences',
    home_popular_destinations: 'Popular Destinations',
    home_categories: 'Travel Themes',
    home_view_all: 'View All',
    home_upcoming_trip: 'Upcoming Reservation',

    tour_overview: 'Overview',
    tour_itinerary: 'Day-by-Day Plan',
    tour_reviews: 'Guest Reviews',
    tour_highlights: 'Experience Highlights',
    tour_included: "What's Included",
    tour_excluded: "What's Excluded",
    tour_per_person: 'per traveler',
    tour_duration: 'Duration',
    tour_rating: 'Rating',
    tour_group_size: 'Group Size',
    tour_best_time: 'Best Season',
    tour_similar_tours: 'Similar Experiences',
    tour_write_review: 'Write Review',
    tour_packing_checklist: 'Packing Checklist',

    booking_e_ticket: 'OFFICIAL E-TICKET PASS',
    booking_confirmed: 'Booking Confirmed',
    booking_reference: 'REFERENCE',
    booking_travel_date: 'Travel Date',
    booking_travelers: 'Travelers',
    booking_total_paid: 'Total Paid',
    booking_scan_prompt: 'Scan at check-in or present to tour concierge',
    booking_share_pass: 'Share E-Ticket Pass',
    booking_cancel_reservation: 'Cancel Reservation',
    booking_no_reservations: 'No Reservations Yet',

    profile_title: 'Profile & Settings',
    profile_passenger_pass: 'Passenger Explorer Pass',
    profile_preferences: 'Travel Preferences',
    profile_language: 'App Language',
    profile_currency: 'Currency',
    profile_notifications: 'Notifications & Alerts',
    profile_concierge_support: 'Concierge & Priority Support',
    profile_sign_in: 'Sign In',
    profile_sign_out: 'Sign Out',

    offline_mode_active: 'Offline Mode Active',
    back_online: 'Back Online',
    notifications_title: 'Notifications',
    departure_reminder: 'Departure Reminder',
  },

  gu: {
    nav_home: 'હોમ',
    nav_explore: 'પ્રવાસો',
    nav_bookings: 'બુકિંગ્સ',
    nav_wishlist: 'સાચવેલ',
    nav_profile: 'પ્રોફાઇલ',

    action_search: 'પ્રવાસો અને સ્થળો શોધો...',
    action_book_now: 'હમણાં જ બુક કરો',
    action_view_details: 'વિગતો જુઓ',
    action_share: 'શેર કરો',
    action_save: 'સાચવો',
    action_saved: 'સાચવેલ',
    action_cancel: 'રદ કરો',
    action_confirm: 'ખાતરી કરો',
    action_back: 'પાછા જાઓ',
    action_retry: 'ફરી પ્રયાસ કરો',
    action_filter: 'ફિલ્ટર્સ',
    action_sort: 'ક્રમબદ્ધ કરો',
    action_apply: 'લાગુ કરો',
    action_reset: 'રીસેટ',

    home_welcome: 'તમારો આગામી પ્રવાસ શોધો',
    home_tagline: 'ગુજરાતના શ્રેષ્ઠ સંસ્કૃતિ અને સાહસિક પ્રવાસો',
    home_featured_tours: 'વિશેષ પ્રવાસો',
    home_popular_destinations: 'લોકપ્રિય સ્થળો',
    home_categories: 'પ્રવાસ થીમ્સ',
    home_view_all: 'બધું જુઓ',
    home_upcoming_trip: 'આગામી પ્રવાસ કાઉન્ટડાઉન',

    tour_overview: 'વિહંગાવલોકન',
    tour_itinerary: 'દૈનિક પ્રવાસ યોજના',
    tour_reviews: 'યાત્રિકોની સમીક્ષાઓ',
    tour_highlights: 'મુખ્ય આકર્ષણો',
    tour_included: 'શું સામેલ છે',
    tour_excluded: 'શું સામેલ નથી',
    tour_per_person: 'પ્રતિ યાત્રિક',
    tour_duration: 'સમયગાળો',
    tour_rating: 'રેટિંગ',
    tour_group_size: 'જૂથ કદ',
    tour_best_time: 'શ્રેષ્ઠ ઋતુ',
    tour_similar_tours: 'સમાન પ્રવાસો',
    tour_write_review: 'સમીક્ષા લખો',
    tour_packing_checklist: 'પેકિંગ ચેકલિસ્ટ',

    booking_e_ticket: 'સત્તાવાર ઈ-ટિકિટ પાસ',
    booking_confirmed: 'બુકિંગ કન્ફર્મ થયું',
    booking_reference: 'રેફરન્સ નંબર',
    booking_travel_date: 'પ્રવાસ તારીખ',
    booking_travelers: 'પ્રવાસીઓ',
    booking_total_paid: 'કુલ ચૂકવણી',
    booking_scan_prompt: 'ચેક-ઇન સમયે અથવા ટૂર ગાઇડને બતાવો',
    booking_share_pass: 'ઈ-ટિકિટ પાસ શેર કરો',
    booking_cancel_reservation: 'બુકિંગ રદ કરો',
    booking_no_reservations: 'હજુ સુધી કોઈ બુકિંગ નથી',

    profile_title: 'પ્રોફાઇલ અને સેટિંગ્સ',
    profile_passenger_pass: 'યાત્રી એક્સપ્લોરર પાસ',
    profile_preferences: 'પ્રવાસ પસંદગીઓ',
    profile_language: 'એપ્લિકેશન ભાષા',
    profile_currency: 'ચલણ (કરન્સી)',
    profile_notifications: 'સૂચનાઓ અને એલર્ટ્સ',
    profile_concierge_support: 'સહાયતા અને કન્સિયર્જ',
    profile_sign_in: 'સાઇન ઇન',
    profile_sign_out: 'સાઇન આઉટ',

    offline_mode_active: 'ઑફલાઇન મોડ સક્રિય',
    back_online: 'પાછા ઑનલાઇન જોડાયા',
    notifications_title: 'સૂચનાઓ (નોટિફિકેશન)',
    departure_reminder: 'પ્રસ્થાન રીમાઇન્ડર',
  },

  hi: {
    nav_home: 'होम',
    nav_explore: 'यात्राएं',
    nav_bookings: 'बुकिंग्स',
    nav_wishlist: 'विशलिस्ट',
    nav_profile: 'प्रोफ़ाइल',

    action_search: 'टूर और गंतव्य खोजें...',
    action_book_now: 'अभी बुक करें',
    action_view_details: 'विवरण देखें',
    action_share: 'शेयर करें',
    action_save: 'सहेजें',
    action_saved: 'सहेजा गया',
    action_cancel: 'रद्द करें',
    action_confirm: 'पुष्टि करें',
    action_back: 'वापस',
    action_retry: 'पुनः प्रयास',
    action_filter: 'फ़िल्टर',
    action_sort: 'क्रमबद्ध करें',
    action_apply: 'लागू करें',
    action_reset: 'रीसेट',

    home_welcome: 'अपनी अगली यात्रा खोजें',
    home_tagline: 'विशिष्ट और यादगार यात्रा अनुभव',
    home_featured_tours: 'प्रमुख यात्राएं',
    home_popular_destinations: 'लोकप्रिय गंतव्य',
    home_categories: 'यात्रा श्रेणियां',
    home_view_all: 'सभी देखें',
    home_upcoming_trip: 'आगामी यात्रा',

    tour_overview: 'अवलोकन',
    tour_itinerary: 'दैनिक कार्यक्रम',
    tour_reviews: 'यात्रियों की समीक्षाएं',
    tour_highlights: 'प्रमुख विशेषताएं',
    tour_included: 'शामिल सुविधाएं',
    tour_excluded: 'शामिल नहीं',
    tour_per_person: 'प्रति यात्री',
    tour_duration: 'अवधि',
    tour_rating: 'रेटिंग',
    tour_group_size: 'समूह आकार',
    tour_best_time: 'सर्वोत्तम मौसम',
    tour_similar_tours: 'समान यात्राएं',
    tour_write_review: 'समीक्षा लिखें',
    tour_packing_checklist: 'पैकिंग चेकलिस्ट',

    booking_e_ticket: 'आधिकारिक ई-टिकट पास',
    booking_confirmed: 'बुकिंग पुष्ट',
    booking_reference: 'संदर्भ संख्या',
    booking_travel_date: 'यात्रा तिथि',
    booking_travelers: 'यात्री संख्या',
    booking_total_paid: 'कुल भुगतान',
    booking_scan_prompt: 'चेक-इन पर या टूर गाइड को प्रस्तुत करें',
    booking_share_pass: 'ई-टिकट पास साझा करें',
    booking_cancel_reservation: 'आरक्षण रद्द करें',
    booking_no_reservations: 'कोई आरक्षण नहीं',

    profile_title: 'प्रोफ़ाइल और सेटिंग्स',
    profile_passenger_pass: 'यात्री पास',
    profile_preferences: 'यात्रा प्राथमिकताएं',
    profile_language: 'ऐप भाषा',
    profile_currency: 'मुद्रा',
    profile_notifications: 'सूचनाएं एवं अलर्ट',
    profile_concierge_support: 'सहायता एवं कंसीयर्ज',
    profile_sign_in: 'साइन इन',
    profile_sign_out: 'साइन आउट',

    offline_mode_active: 'ऑफ़लाइन मोड सक्रिय',
    back_online: 'वापस ऑनलाइन',
    notifications_title: 'सूचनाएं',
    departure_reminder: 'प्रस्थान अनुस्मारक',
  },

  th: {
    nav_home: 'หน้าแรก',
    nav_explore: 'ค้นหาทัวร์',
    nav_bookings: 'การจอง',
    nav_wishlist: 'รายการโปรด',
    nav_profile: 'โปรไฟล์',

    action_search: 'ค้นหาทัวร์และจุดหมายปลายทาง...',
    action_book_now: 'จองการเดินทาง',
    action_view_details: 'ดูรายละเอียด',
    action_share: 'แชร์',
    action_save: 'บันทึก',
    action_saved: 'บันทึกแล้ว',
    action_cancel: 'ยกเลิก',
    action_confirm: 'ยืนยัน',
    action_back: 'ย้อนกลับ',
    action_retry: 'ลองใหม่',
    action_filter: 'ตัวกรอง',
    action_sort: 'เรียงตาม',
    action_apply: 'ใช้ตัวกรอง',
    action_reset: 'ล้างค่า',

    home_welcome: 'ค้นหาการผจญภัยครั้งต่อไปของคุณ',
    home_tagline: 'แพ็กเกจทัวร์และการผจญภัยสุดพิเศษในเอเชีย',
    home_featured_tours: 'ทัวร์แนะนำพิเศษ',
    home_popular_destinations: 'จุดหมายยอดนิยม',
    home_categories: 'ธีมการท่องเที่ยว',
    home_view_all: 'ดูทั้งหมด',
    home_upcoming_trip: 'การเดินทางที่กำลังจะมาถึง',

    tour_overview: 'ภาพรวม',
    tour_itinerary: 'แผนการเดินทางรายวัน',
    tour_reviews: 'รีวิวจากผู้เดินทาง',
    tour_highlights: 'ไฮไลท์การเดินทาง',
    tour_included: 'สิ่งที่รวมในแพ็กเกจ',
    tour_excluded: 'สิ่งที่ไม่รวม',
    tour_per_person: 'ต่อท่าน',
    tour_duration: 'ระยะเวลา',
    tour_rating: 'คะแนน',
    tour_group_size: 'ขนาดกลุ่ม',
    tour_best_time: 'ฤดูกาลที่เหมาะสม',
    tour_similar_tours: 'ทัวร์ที่คล้ายกัน',
    tour_write_review: 'เขียนรีวิว',
    tour_packing_checklist: 'รายการสัมภาระที่ต้องเตรียม',

    booking_e_ticket: 'บัตรโดยสารอิเล็กทรอนิกส์ E-TICKET',
    booking_confirmed: 'ยืนยันการจองเรียบร้อย',
    booking_reference: 'รหัสอ้างอิง',
    booking_travel_date: 'วันเดินทาง',
    booking_travelers: 'ผู้เดินทาง',
    booking_total_paid: 'ยอดรวมที่ชำระ',
    booking_scan_prompt: 'สแกนเมื่อเช็คอินหรือแสดงต่อเจ้าหน้าที่',
    booking_share_pass: 'แชร์บัตร E-Ticket',
    booking_cancel_reservation: 'ยกเลิกการจอง',
    booking_no_reservations: 'ยังไม่มีประวัติการจอง',

    profile_title: 'โปรไฟล์และการตั้งค่า',
    profile_passenger_pass: 'บัตรสมาชิกผู้เดินทาง',
    profile_preferences: 'การตั้งค่าการเดินทาง',
    profile_language: 'ภาษาของแอป',
    profile_currency: 'สกุลเงิน',
    profile_notifications: 'การแจ้งเตือนและการเตือนการเดินทาง',
    profile_concierge_support: 'บริการช่วยเหลือและคอนเซียร์จ',
    profile_sign_in: 'เข้าสู่ระบบ',
    profile_sign_out: 'ออกจากระบบ',

    offline_mode_active: 'โหมดออฟไลน์ทำงาน',
    back_online: 'กลับสู่ออนไลน์แล้ว',
    notifications_title: 'การแจ้งเตือน',
    departure_reminder: 'เตือนการเดินทาง',
  },

  vi: {
    nav_home: 'Trang chủ',
    nav_explore: 'Khám phá',
    nav_bookings: 'Đặt chỗ',
    nav_wishlist: 'Yêu thích',
    nav_profile: 'Hồ sơ',

    action_search: 'Tìm kiếm tour & điểm đến...',
    action_book_now: 'Đặt Trải Nghiệm',
    action_view_details: 'Xem chi tiết',
    action_share: 'Chia sẻ',
    action_save: 'Lưu',
    action_saved: 'Đã lưu',
    action_cancel: 'Hủy',
    action_confirm: 'Xác nhận',
    action_back: 'Quay lại',
    action_retry: 'Thử lại',
    action_filter: 'Bộ lọc',
    action_sort: 'Sắp xếp',
    action_apply: 'Áp dụng',
    action_reset: 'Đặt lại',

    home_welcome: 'Tìm kiếm chuyến đi tiếp theo',
    home_tagline: 'Hành trình khám phá Đông Nam Á ấn tượng',
    home_featured_tours: 'Tour Nổi Bật',
    home_popular_destinations: 'Điểm Đến Hấp Dẫn',
    home_categories: 'Chủ Đề Du Lịch',
    home_view_all: 'Xem tất cả',
    home_upcoming_trip: 'Chuyến đi sắp tới',

    tour_overview: 'Tổng quan',
    tour_itinerary: 'Lịch trình từng ngày',
    tour_reviews: 'Đánh giá du khách',
    tour_highlights: 'Điểm nhấn tour',
    tour_included: 'Bao gồm',
    tour_excluded: 'Không bao gồm',
    tour_per_person: 'mỗi khách',
    tour_duration: 'Thời lượng',
    tour_rating: 'Đánh giá',
    tour_group_size: 'Quy mô đoàn',
    tour_best_time: 'Mùa lý tưởng',
    tour_similar_tours: 'Tour tương tự',
    tour_write_review: 'Viết đánh giá',
    tour_packing_checklist: 'Hành lý chuẩn bị',

    booking_e_ticket: 'VÉ ĐIỆN TỬ E-TICKET CHÍNH THỨC',
    booking_confirmed: 'Đặt chỗ thành công',
    booking_reference: 'MÃ ĐẶT CHỖ',
    booking_travel_date: 'Ngày khởi hành',
    booking_travelers: 'Số lượng khách',
    booking_total_paid: 'Tổng thanh toán',
    booking_scan_prompt: 'Quét mã khi làm thủ tục hoặc xuất trình cho hướng dẫn viên',
    booking_share_pass: 'Chia sẻ vé E-Ticket',
    booking_cancel_reservation: 'Hủy đặt chỗ',
    booking_no_reservations: 'Chưa có đặt chỗ nào',

    profile_title: 'Hồ sơ & Cài đặt',
    profile_passenger_pass: 'Thẻ Du Khách Khám Phá',
    profile_preferences: 'Tùy chọn du lịch',
    profile_language: 'Ngôn ngữ ứng dụng',
    profile_currency: 'Tiền tệ',
    profile_notifications: 'Thông báo & Nhắc nhở',
    profile_concierge_support: 'Hỗ trợ khách hàng ưu tiên',
    profile_sign_in: 'Đăng nhập',
    profile_sign_out: 'Đăng xuất',

    offline_mode_active: 'Chế độ ngoại tuyến đang bật',
    back_online: 'Đã kết nối lại trực tuyến',
    notifications_title: 'Thông báo',
    departure_reminder: 'Nhắc nhở khởi hành',
  },

  ar: {
    nav_home: 'الرئيسية',
    nav_explore: 'استكشف',
    nav_bookings: 'حجوزاتي',
    nav_wishlist: 'المفضلة',
    nav_profile: 'حسابي',

    action_search: 'ابحث عن الجولات والوجهات...',
    action_book_now: 'احجز التجربة',
    action_view_details: 'عرض التفاصيل',
    action_share: 'مشاركة',
    action_save: 'حفظ',
    action_saved: 'محفوظ',
    action_cancel: 'إلغاء',
    action_confirm: 'تأكيد',
    action_back: 'رجوع',
    action_retry: 'إعادة المحاولة',
    action_filter: 'تصفية',
    action_sort: 'ترتيب حسب',
    action_apply: 'تطبيق',
    action_reset: 'إعادة تعيين',

    home_welcome: 'اكتشف رحلتك الفاخرة القادمة',
    home_tagline: 'تجارب سياحية استثنائية ورحلات كبار الشخصيات',
    home_featured_tours: 'تجارب مميزة',
    home_popular_destinations: 'أبرز الوجهات',
    home_categories: 'أنماط السفر',
    home_view_all: 'عرض الكل',
    home_upcoming_trip: 'الرحلة القادمة',

    tour_overview: 'نظرة عامة',
    tour_itinerary: 'جدول الرحلة اليومي',
    tour_reviews: 'تقييمات الضيوف',
    tour_highlights: 'أبرز المزايا',
    tour_included: 'المشمولات',
    tour_excluded: 'غير مشمول',
    tour_per_person: 'لكل مسافر',
    tour_duration: 'المدة',
    tour_rating: 'التقييم',
    tour_group_size: 'حجم المجموعة',
    tour_best_time: 'أفضل موسم للزيارة',
    tour_similar_tours: 'تجارب مشابهة',
    tour_write_review: 'كتابة تقييم',
    tour_packing_checklist: 'قائمة الأمتعة الموصى بها',

    booking_e_ticket: 'تذكرة المرور الإلكترونية الرسمية',
    booking_confirmed: 'تم تأكيد الحجز',
    booking_reference: 'رقم الحجز',
    booking_travel_date: 'تاريخ السفر',
    booking_travelers: 'المسافرون',
    booking_total_paid: 'المبلغ الإجمالي المدفوع',
    booking_scan_prompt: 'امسح الرمز عند تسجيل الوصول أو أظهره للمرشد',
    booking_share_pass: 'مشاركة التذكرة الإلكترونية',
    booking_cancel_reservation: 'إلغاء الحجز',
    booking_no_reservations: 'لا توجد حجوزات حالياً',

    profile_title: 'الملف الشخصي والإعدادات',
    profile_passenger_pass: 'بطاقة المسافر الحصرية',
    profile_preferences: 'تفضيلات السفر',
    profile_language: 'لغة التطبيق',
    profile_currency: 'العملة',
    profile_notifications: 'الإشعارات وتنبيهات المغادرة',
    profile_concierge_support: 'خدمة الكونسيرج والدعم المتميز',
    profile_sign_in: 'تسجيل الدخول',
    profile_sign_out: 'تسجيل الخروج',

    offline_mode_active: 'الوضع غير المتصل نشط',
    back_online: 'تمت استعادة الاتصال',
    notifications_title: 'الإشعارات',
    departure_reminder: 'تذكير موعد المغادرة',
  },
};
