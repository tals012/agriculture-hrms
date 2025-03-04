"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ToastContainer, toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useProfile from "@/hooks/useProfile";
import getGroupMembers from "@/app/(backend)/actions/groups/getGroupMembers";
import styles from "@/styles/screens/workerAttendance.module.scss";
import getGroupById from "@/app/(backend)/actions/groups/getGroupById";

// Translation data
const translations = {
  English: {
    language: "Language",
    workerNameLabel: "Worker Name",
    passportLabel: "Passport:",
    generalDetails: "General Details",
    workerIdLabel: "Worker ID",
    passportNumberLabel: "Passport Number",
    statusLabel: "Status",
    phoneLabel: "Phone",
    countryOfBirthLabel: "Country of Birth",
    birthDateLabel: "Birth Date",
    clientNameLabel: "Client Name",
    siteNameLabel: "Site Name",
    containersSection: "Containers Section",
    containersFilled: "Containers Filled",
    selectOption: "Select option",
    containers: "containers",
    enterCustomValue: "Enter custom value",
    reportDate: "Report Date",
    selectDate: "Select date",
    submitAttendance: "Submit Attendance",
    processing: "Processing...",
    attendanceSuccess: "Attendance data submitted successfully",
    title: "Worker Attendance",
    infoTitle: "Worker Information",
    attendanceTitle: "Attendance Information",
    reportDateLabel: "Report Date",
    containersFilledLabel: "Containers Filled",
    customAmountLabel: "Custom Amount",
    submitButtonLabel: "Submit Attendance",
    selectContainerPlaceholder: "Select or enter custom",
    enterCustomPlaceholder: "Enter custom amount",
    custom: "Custom",
    loading: "Loading...",
  },
  Arabic: {
    language: "اللغة",
    workerNameLabel: "اسم العامل",
    passportLabel: "جواز سفر:",
    generalDetails: "التفاصيل العامة",
    workerIdLabel: "رقم العامل",
    passportNumberLabel: "رقم جواز السفر",
    statusLabel: "الحالة",
    phoneLabel: "الهاتف",
    countryOfBirthLabel: "بلد الميلاد",
    birthDateLabel: "تاريخ الميلاد",
    clientNameLabel: "اسم العميل",
    siteNameLabel: "اسم الموقع",
    containersSection: "قسم الحاويات",
    containersFilled: "الحاويات المملوءة",
    selectOption: "حدد خيارًا",
    containers: "حاويات",
    enterCustomValue: "أدخل قيمة مخصصة",
    reportDate: "تاريخ التقرير",
    selectDate: "حدد التاريخ",
    submitAttendance: "إرسال الحضور",
    processing: "جاري المعالجة...",
    attendanceSuccess: "تم إرسال بيانات الحضور بنجاح",
    title: "حضور العامل",
    infoTitle: "معلومات العامل",
    attendanceTitle: "معلومات الحضور",
    reportDateLabel: "تاريخ التقرير",
    containersFilledLabel: "الحاويات المملوءة",
    customAmountLabel: "كمية مخصصة",
    submitButtonLabel: "تقديم الحضور",
    selectContainerPlaceholder: "حدد أو أدخل مخصص",
    enterCustomPlaceholder: "أدخل كمية مخصصة",
    custom: "مخصص",
    loading: "جاري التحميل...",
  },
  Chinese: {
    language: "语言",
    workerNameLabel: "工人姓名",
    passportLabel: "护照:",
    generalDetails: "一般细节",
    workerIdLabel: "工人编号",
    passportNumberLabel: "护照号码",
    statusLabel: "状态",
    phoneLabel: "电话",
    countryOfBirthLabel: "出生国家",
    birthDateLabel: "出生日期",
    clientNameLabel: "客户名称",
    siteNameLabel: "站点名称",
    containersSection: "容器部分",
    containersFilled: "填充的容器",
    selectOption: "选择选项",
    containers: "容器",
    enterCustomValue: "输入自定义值",
    reportDate: "报告日期",
    selectDate: "选择日期",
    submitAttendance: "提交出勤",
    processing: "处理中...",
    attendanceSuccess: "出勤数据提交成功",
    title: "工人出勤",
    infoTitle: "工人信息",
    attendanceTitle: "出勤信息",
    reportDateLabel: "报告日期",
    containersFilledLabel: "已填充的容器",
    customAmountLabel: "自定义数量",
    submitButtonLabel: "提交出勤",
    selectContainerPlaceholder: "选择或输入自定义",
    enterCustomPlaceholder: "输入自定义数量",
    custom: "自定义",
    loading: "加载中...",
  },
  Thai: {
    language: "ภาษา",
    workerNameLabel: "ชื่อคนงาน",
    passportLabel: "หนังสือเดินทาง:",
    generalDetails: "รายละเอียดทั่วไป",
    workerIdLabel: "รหัสคนงาน",
    passportNumberLabel: "หมายเลขหนังสือเดินทาง",
    statusLabel: "สถานะ",
    phoneLabel: "โทรศัพท์",
    countryOfBirthLabel: "ประเทศกำเนิด",
    birthDateLabel: "วันเกิด",
    clientNameLabel: "ชื่อลูกค้า",
    siteNameLabel: "ชื่อไซต์",
    containersSection: "ส่วนของภาชนะ",
    containersFilled: "ภาชนะที่เติม",
    selectOption: "เลือกตัวเลือก",
    containers: "ภาชนะ",
    enterCustomValue: "ป้อนค่าที่กำหนดเอง",
    reportDate: "วันที่รายงาน",
    selectDate: "เลือกวันที่",
    submitAttendance: "ส่งข้อมูลการเข้างาน",
    processing: "กำลังประมวลผล...",
    attendanceSuccess: "ส่งข้อมูลการเข้างานสำเร็จแล้ว",
    title: "การเข้างานของคนงาน",
    infoTitle: "ข้อมูลคนงาน",
    attendanceTitle: "ข้อมูลการเข้างาน",
    reportDateLabel: "วันที่รายงาน",
    containersFilledLabel: "ตู้คอนเทนเนอร์ที่เติมแล้ว",
    customAmountLabel: "จำนวนที่กำหนดเอง",
    submitButtonLabel: "ส่งข้อมูลการเข้างาน",
    selectContainerPlaceholder: "เลือกหรือป้อนค่าที่กำหนดเอง",
    enterCustomPlaceholder: "ป้อนจำนวนที่กำหนดเอง",
    custom: "กำหนดเอง",
    loading: "กำลังโหลด...",
  },
  Srilankan: {
    language: "භාෂාව",
    workerNameLabel: "සේවක නම",
    passportLabel: "ගමන් බලපත්‍රය:",
    generalDetails: "සාමාන්‍ය විස්තර",
    workerIdLabel: "සේවක අයිඩි",
    passportNumberLabel: "විදේශ ගමන් බලපත්‍ර අංකය",
    statusLabel: "තත්ත්වය",
    phoneLabel: "දුරකථන",
    countryOfBirthLabel: "උපන් රට",
    birthDateLabel: "උපන් දිනය",
    clientNameLabel: "සේවාදායක නම",
    siteNameLabel: "අඩවි නම",
    containersSection: "බහාලුම් කොටස",
    containersFilled: "පිරවූ බහාලුම්",
    selectOption: "විකල්පය තෝරන්න",
    containers: "බහාලුම්",
    enterCustomValue: "අභිරුචි අගය ඇතුළත් කරන්න",
    reportDate: "වාර්තා දිනය",
    selectDate: "දිනය තෝරන්න",
    submitAttendance: "පැමිණීම ඉදිරිපත් කරන්න",
    processing: "සැකසීම...",
    attendanceSuccess: "පැමිණීමේ දත්ත සාර්ථකව ඉදිරිපත් කරන ලදී",
    title: "සේවක පැමිණීම",
    infoTitle: "සේවක තොරතුරු",
    attendanceTitle: "පැමිණීමේ තොරතුරු",
    reportDateLabel: "වාර්තා දිනය",
    containersFilledLabel: "පිරවූ බහාලුම්",
    customAmountLabel: "අභිරුචි ප්‍රමාණය",
    submitButtonLabel: "පැමිණීම ඉදිරිපත් කරන්න",
    selectContainerPlaceholder: "තෝරන්න හෝ අභිරුචි ඇතුළත් කරන්න",
    enterCustomPlaceholder: "අභිරුචි ප්‍රමාණය ඇතුළත් කරන්න",
    custom: "අභිරුචි",
    loading: "පූරණය වෙමින්...",
  },
  Hindi: {
    language: "भाषा",
    workerNameLabel: "कार्यकर्ता का नाम",
    passportLabel: "पासपोर्ट:",
    generalDetails: "सामान्य विवरण",
    workerIdLabel: "कार्यकर्ता आईडी",
    passportNumberLabel: "पासपोर्ट नंबर",
    statusLabel: "स्थिति",
    phoneLabel: "फोन",
    countryOfBirthLabel: "जन्म देश",
    birthDateLabel: "जन्म तिथि",
    clientNameLabel: "क्लाइंट का नाम",
    siteNameLabel: "साइट का नाम",
    containersSection: "कंटेनर सेक्शन",
    containersFilled: "भरे गए कंटेनर",
    selectOption: "विकल्प चुनें",
    containers: "कंटेनर",
    enterCustomValue: "कस्टम मूल्य दर्ज करें",
    reportDate: "रिपोर्ट तिथि",
    selectDate: "तिथि चुनें",
    submitAttendance: "उपस्थिति जमा करें",
    processing: "प्रोसेसिंग...",
    attendanceSuccess: "उपस्थिति डेटा सफलतापूर्वक जमा किया गया",
    title: "कार्यकर्ता उपस्थिति",
    infoTitle: "कार्यकर्ता जानकारी",
    attendanceTitle: "उपस्थिति जानकारी",
    reportDateLabel: "रिपोर्ट तिथि",
    containersFilledLabel: "भरे गए कंटेनर",
    customAmountLabel: "कस्टम मात्रा",
    submitButtonLabel: "उपस्थिति जमा करें",
    selectContainerPlaceholder: "चुनें या कस्टम दर्ज करें",
    enterCustomPlaceholder: "कस्टम मात्रा दर्ज करें",
    custom: "कस्टम",
    loading: "लोड हो रहा है...",
  },
  Hebrew: {
    language: "עברית",
    workerNameLabel: "שם עובד",
    passportLabel: "דרכון:",
    generalDetails: "פרטים כלליים",
    workerIdLabel: "מספר עובד",
    statusLabel: "סטטוס",
    phoneLabel: "פלאפון",
    countryOfBirthLabel: "ארץ לידה",
    birthDateLabel: "תאריך לידה",
    clientNameLabel: "שם לקוח",
    siteNameLabel: "שם אתר",
    title: "נוכחות עובד",
    infoTitle: "פרטי עובד",
    attendanceTitle: "פרטי נוכחות",
    reportDateLabel: "תאריך דיווח",
    containersFilledLabel: "מכולות שמולאו",
    customAmountLabel: "כמות מותאמת אישית",
    submitButtonLabel: "שלח נוכחות",
    selectContainerPlaceholder: "בחר או הזן כמות מותאמת אישית",
    enterCustomPlaceholder: "הזן כמות מותאמת אישית",
    processing: "מעבד...",
    attendanceSuccess: "נתוני הנוכחות נשלחו בהצלחה",
    passportNumberLabel: "מספר דרכון",
    containers: "מכולות",
    selectOption: "בחר אפשרות",
    custom: "מותאם אישית",
    loading: "טוען...",
  },
};

// Hebrew translations (default for RTL elements in the design)
const hebrewTexts = {
  workerNameLabel: "שם עובד/ת",
  passportLabel: "דרכון:",
  generalDetails: "פרטים כלליים",
  workerIdLabel: "מספר עובד",
  passportNumberLabel: "מספר דרכון",
  statusLabel: "סטטוס",
  phoneLabel: "פלאפון",
  countryOfBirthLabel: "ארץ לידה",
  birthDateLabel: "תאריך לידה",
  clientNameLabel: "שם לקוח",
  siteNameLabel: "שם אתר",
};

export default function AttendancePage() {
  // get groupId from query
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const groupId = searchParams.get("groupId");
  const [groupInfo, setGroupInfo] = useState({
    name: "",
    fieldName: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    administratorName: "",
    reportDate: new Date(),
    selectedGroup: null,
    selectedPricing: null,
    defaultSchedule: null,
    containersFilled: "",
  });

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [selectedContainerOption, setSelectedContainerOption] = useState("");
  const [customContainerValue, setCustomContainerValue] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const containerOptions = [
    { value: "1", label: "1" },
    { value: "1.5", label: "1.5" },
    { value: "1.7", label: "1.7" },
    { value: "2", label: "2" },
    { value: "2.5", label: "2.5" },
    { value: "2.7", label: "2.7" },
    { value: "3", label: "3" },
    { value: "5", label: "5" },
    { value: "custom", label: translations[selectedLanguage].custom },
  ];

  const { profile, loading } = useProfile();

  useEffect(() => {
    if (profile && profile.name) {
      setFormData((prev) => ({
        ...prev,
        administratorName: profile.name,
      }));
    }
  }, [profile]);

  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (groupId) {
        try {
          setIsLoading(true);
          const groupData = await getGroupById({ groupId });
          if (groupData) {
            setGroupInfo({
              name: groupData.data.name,
              fieldName: groupData.data.field ? groupData.data.field.name : "",
            });
          }
        } catch (error) {
          console.error("Error fetching group info:", error);
          toast.error("Failed to load group information");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchGroupInfo();
  }, [groupId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContainerOptionChange = (value) => {
    setSelectedContainerOption(value);

    if (value !== "custom") {
      setFormData((prev) => ({
        ...prev,
        containersFilled: value,
      }));
      setCustomContainerValue("");
    }
  };

  const handleCustomContainerChange = (e) => {
    const value = e.target.value;
    setCustomContainerValue(value);
    setFormData((prev) => ({
      ...prev,
      containersFilled: value,
    }));
  };

  const toggleAccordion = () => {
    setIsAccordionOpen(!isAccordionOpen);
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      reportDate: date,
    });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);

    // You could also save the language preference to localStorage
    try {
      localStorage.setItem("preferredLanguage", newLanguage);
    } catch (error) {
      console.error("Failed to save language preference:", error);
    }
  };

  // Effect to load language preference from localStorage on initial load
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem("preferredLanguage");
      if (savedLanguage && translations[savedLanguage]) {
        setSelectedLanguage(savedLanguage);
      }
    } catch (error) {
      console.error("Failed to load language preference:", error);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.containersFilled) {
      toast.error("Please select or enter the number of containers filled");
      return;
    }

    try {
      setIsLoading(true);
      // Submit attendance data to backend
      // TODO: Implement API call to save data

      toast.success(translations[selectedLanguage].attendanceSuccess);

      // Reset form after successful submission
      setFormData((prev) => ({
        ...prev,
        containersFilled: "",
      }));
    } catch (error) {
      console.error("Error submitting attendance data:", error);
      toast.error("Failed to submit attendance data");
    } finally {
      setIsLoading(false);
    }
  };

  // Format current date for display
  const formattedCurrentDate = format(new Date(), "dd MMMM yyyy");

  const rtlLanguages = ["Arabic", "Hebrew"];
  const isRtl = rtlLanguages.includes(selectedLanguage);
  console.log(isRtl, "isRtl");

  if (loading || isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>{translations[selectedLanguage].loading || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      style={{
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      <div className={styles.languageSelector}>
        <div className={styles.languageLabel}>
          <span className={styles.languageIcon}>🌐</span>
          {translations[selectedLanguage].language}:
        </div>
        <select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className={styles.languageDropdown}
        >
          <option value="English">English</option>
          <option value="Arabic">العربية</option>
          <option value="Chinese">中文</option>
          <option value="Thai">ไทย</option>
          <option value="Srilankan">සිංහල</option>
          <option value="Hindi">हिन्दी</option>
          <option value="Hebrew">עברית</option>
        </select>
      </div>

      <div className={styles.profileHeader}>
        <div className={styles.profileRow}>
          <div className={styles.profilePhotoContainer}>
            <div className={styles.profilePhoto}>
              {/* Worker photo would go here */}
              <div className={styles.defaultPhoto}>👷</div>
            </div>
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.workerName}>
              <span className={styles.nameLabel}>
                {translations[selectedLanguage].workerNameLabel}
              </span>
              {profile?.name ? profile.name : profile?.nameHe || "Worker Name"}
            </h1>
          </div>
        </div>
        <div className={styles.passportNumber}>
          <span>{translations[selectedLanguage].passportLabel}</span>{" "}
          {profile?.worker?.passport || "U09614337"}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.formCard}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm6 5H6v-.99c.2-.72 3.3-2.01 6-2.01s5.8 1.29 6 2v1z"
                  fill="#0a4896"
                />
              </svg>
            </span>
            {translations[selectedLanguage].infoTitle}
          </div>
          <div
            className={styles.infoTable}
            style={{
              direction: isRtl ? "ltr" : "rtl",
            }}
          >
            {profile && (
              <>
                <div className={styles.infoRow}>
                  <div className={styles.infoValue}>
                    {profile?.worker?.id || "2771"}
                  </div>
                  <div className={styles.infoLabel}>
                    {translations[selectedLanguage].workerIdLabel}
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoValue}>
                    {profile?.worker?.passport || "U09614337"}
                  </div>
                  <div className={styles.infoLabel}>
                    {translations[selectedLanguage].passportNumberLabel}
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoValue}>
                    {profile?.worker?.nationality || "יצא"}
                  </div>
                  <div className={styles.infoLabel}>
                    {translations[selectedLanguage].statusLabel}
                  </div>
                </div>
                {profile?.worker?.primaryPhone && (
                  <div className={styles.infoRow}>
                    <div className={styles.infoValue}>
                      {profile.worker.primaryPhone}
                      <span className={styles.whatsappIcon}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M17.6 6.32A7.85 7.85 0 0 0 12 4.02 7.94 7.94 0 0 0 4.06 12a7.9 7.9 0 0 0 1.18 4.14L4 20l3.96-1.04a7.9 7.9 0 0 0 4.04 1.1A7.94 7.94 0 0 0 20 12a7.86 7.86 0 0 0-2.4-5.68zM12 18.82c-1.18 0-2.33-.32-3.33-.92l-.24-.14-2.46.64.66-2.4-.16-.24a6.58 6.58 0 0 1-1.02-3.56A6.6 6.6 0 0 1 12 5.6a6.52 6.52 0 0 1 4.65 1.96 6.57 6.57 0 0 1 2 4.74 6.59 6.59 0 0 1-6.65 6.52zm3.63-4.92c-.2-.1-1.17-.58-1.35-.64-.18-.06-.32-.1-.45.1-.13.2-.5.64-.62.76-.11.13-.23.15-.43.05a5.46 5.46 0 0 1-1.6-1 6.05 6.05 0 0 1-1.1-1.37c-.12-.2-.01-.3.09-.4.09-.1.2-.24.3-.36.1-.12.13-.21.2-.35.06-.14.03-.26-.02-.36-.05-.1-.45-1.08-.62-1.48-.16-.39-.32-.33-.45-.34h-.38c-.13 0-.35.05-.53.25-.18.2-.7.68-.7 1.66s.72 1.93.82 2.06c.1.13 1.4 2.14 3.4 3 2.01.87 2.01.58 2.37.54.36-.03 1.17-.48 1.33-.94.17-.46.17-.85.12-.94-.05-.08-.13-.13-.38-.23z"
                            fill="#25D366"
                          />
                        </svg>
                      </span>
                    </div>
                    <div className={styles.infoLabel}>
                      {translations[selectedLanguage].phoneLabel}
                    </div>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <div className={styles.infoValue}>
                    {profile?.worker?.country || "תורכיה"}
                  </div>
                  <div className={styles.infoLabel}>
                    {translations[selectedLanguage].countryOfBirthLabel}
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoValue}>
                    {formData.reportDate
                      ? format(formData.reportDate, "dd.MM.yyyy")
                      : "04.07.1983"}
                  </div>
                  <div className={styles.infoLabel}>
                    {translations[selectedLanguage].birthDateLabel}
                  </div>
                </div>
              </>
            )}
            {groupInfo && (
              <>
                <div className={styles.infoRow}>
                  <div className={styles.infoValue}>
                    {groupInfo.name || "אלקטרה"}
                  </div>
                  <div className={styles.infoLabel}>
                    {translations[selectedLanguage].clientNameLabel}
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoValue}>
                    {groupInfo.fieldName || "אלקטרה - 371"}
                  </div>
                  <div className={styles.infoLabel}>
                    {translations[selectedLanguage].siteNameLabel}
                  </div>
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm10 16H4V8h16v12z"
                      fill="#0a4896"
                    />
                    <path
                      d="M13 14c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm-4 0c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm8 0c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z"
                      fill="#0a4896"
                    />
                  </svg>
                </span>
                {translations[selectedLanguage].attendanceTitle}
              </div>

              <div className={styles.formFields}>
                <div className={styles.formField}>
                  <div className={styles.fieldLabel}>
                    {translations[selectedLanguage].containersFilledLabel}
                  </div>
                  <div
                    className={styles.accordionHeader}
                    onClick={toggleAccordion}
                  >
                    <div className={styles.accordionValue}>
                      {formData.containersFilled
                        ? `${formData.containersFilled} ${translations[selectedLanguage].containers}`
                        : translations[selectedLanguage].selectOption}
                    </div>
                    <div
                      className={`${styles.accordionIcon} ${
                        isAccordionOpen ? styles.open : ""
                      }`}
                    >
                      ▼
                    </div>
                  </div>

                  <div
                    className={`${styles.accordionContent} ${
                      isAccordionOpen ? styles.open : ""
                    }`}
                  >
                    <div className={styles.radioGroup}>
                      {containerOptions.map((option) => (
                        <div key={option.value} className={styles.radioOption}>
                          <input
                            type="radio"
                            id={`container-${option.value}`}
                            name="containerOption"
                            value={option.value}
                            checked={selectedContainerOption === option.value}
                            onChange={() =>
                              handleContainerOptionChange(option.value)
                            }
                            className={styles.radioInput}
                          />
                          <label
                            htmlFor={`container-${option.value}`}
                            className={styles.radioLabel}
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>

                    {selectedContainerOption === "custom" && (
                      <div className={styles.customInputWrapper}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={customContainerValue}
                          onChange={handleCustomContainerChange}
                          placeholder={
                            translations[selectedLanguage]
                              .enterCustomPlaceholder
                          }
                          className={styles.customInput}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formField}>
                  <div className={styles.fieldLabel}>
                    {translations[selectedLanguage].reportDateLabel}
                  </div>
                  <div className={styles.datePickerWrapper}>
                    <DatePicker
                      selected={formData.reportDate}
                      onChange={handleDateChange}
                      dateFormat="dd.MM.yyyy"
                      className={styles.datePicker}
                      placeholderText={
                        translations[selectedLanguage].selectDate
                      }
                      id="reportDate"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.submitSection}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className={styles.buttonSpinner}></span>
                    {translations[selectedLanguage].processing}
                  </>
                ) : (
                  translations[selectedLanguage].submitButtonLabel
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}
