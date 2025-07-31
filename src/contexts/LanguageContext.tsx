import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'th';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.orders': 'Orders',
    'nav.menu': 'Menu',
    'nav.settings': 'Settings',
    'header.dashboard': 'Back Office Dashboard',
    
    // Orders
    'orders.title': 'Orders Dashboard',
    'orders.all': 'All Orders',
    'orders.new': 'New Orders',
    'orders.preparing': 'Preparing',
    'orders.ready': 'Ready',
    'orders.completed': 'Completed',
    'orders.refresh': 'Refresh',
    'orders.viewDetails': 'View Details',
    'orders.total': 'Total',
    'orders.noOrders': 'No orders found',
    
    // Order Status
    'status.pending': 'Pending',
    'status.preparing': 'Preparing',
    'status.ready': 'Ready',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    
    // Order Actions
    'action.startPreparing': 'Start Preparing',
    'action.markReady': 'Mark Ready',
    'action.completeOrder': 'Complete Order',
    'action.updating': 'Updating...',
    
    // Order Details
    'orderDetails.title': 'Order',
    'orderDetails.status': 'Order Status',
    'orderDetails.items': 'Order Items',
    'orderDetails.customer': 'Customer Information',
    'orderDetails.details': 'Order Details',
    'orderDetails.print': 'Print',
    'orderDetails.date': 'Order Date',
    'orderDetails.time': 'Order Time',
    'orderDetails.payment': 'Payment',
    'orderDetails.paymentMethod': 'Cash on Pickup',
    'orderDetails.specialInstructions': 'Special Instructions',
    'orderDetails.totalAmount': 'Total Amount',
    'orderDetails.each': 'each',
    
    // Sales
    'sales.title': 'Sales Dashboard',
    'sales.totalOrders': 'Total Orders',
    'sales.totalRevenue': 'Total Revenue',
    'sales.avgOrderValue': 'Avg Order Value',
    'sales.date': 'Date',
    'sales.topItems': 'Top Selling Items',
    'sales.export': 'Export',
    'sales.insights': 'Sales Insights',
    'sales.performance': 'Performance',
    'sales.noData': 'No sales data available',
    
    // Menu
    'menu.title': 'Menu Management',
    'menu.addItem': 'Add Item',
    'menu.search': 'Search menu items...',
    'menu.allCategories': 'All Categories',
    'menu.allItems': 'All Items',
    'menu.availableOnly': 'Available Only',
    'menu.unavailableOnly': 'Unavailable Only',
    'menu.available': 'Available',
    'menu.unavailable': 'Unavailable',
    'menu.hide': 'Hide',
    'menu.show': 'Show',
    'menu.noItems': 'No menu items found',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.na': 'N/A',
    'common.phone': 'Phone',
    'common.email': 'Email',
    'common.name': 'Name',
    'common.customer': 'Customer',
  },
  th: {
    // Navigation
    'nav.orders': 'คำสั่งซื้อ',
    'nav.menu': 'เมนู',
    'nav.settings': 'ตั้งค่า',
    'header.dashboard': 'แดชบอร์ดแบ็คออฟฟิศ',
    
    // Orders
    'orders.title': 'แดชบอร์ดคำสั่งซื้อ',
    'orders.all': 'คำสั่งซื้อทั้งหมด',
    'orders.new': 'คำสั่งซื้อใหม่',
    'orders.preparing': 'กำลังเตรียม',
    'orders.ready': 'พร้อมแล้ว',
    'orders.completed': 'เสร็จสิ้น',
    'orders.refresh': 'รีเฟรช',
    'orders.viewDetails': 'ดูรายละเอียด',
    'orders.total': 'รวม',
    'orders.noOrders': 'ไม่พบคำสั่งซื้อ',
    
    // Order Status
    'status.pending': 'รอดำเนินการ',
    'status.preparing': 'กำลังเตรียม',
    'status.ready': 'พร้อมแล้ว',
    'status.completed': 'เสร็จสิ้น',
    'status.cancelled': 'ยกเลิก',
    
    // Order Actions
    'action.startPreparing': 'เริ่มเตรียม',
    'action.markReady': 'ทำเครื่องหมายว่าพร้อม',
    'action.completeOrder': 'เสร็จสิ้นคำสั่งซื้อ',
    'action.updating': 'กำลังอัปเดต...',
    
    // Order Details
    'orderDetails.title': 'คำสั่งซื้อ',
    'orderDetails.status': 'สถานะคำสั่งซื้อ',
    'orderDetails.items': 'รายการสินค้า',
    'orderDetails.customer': 'ข้อมูลลูกค้า',
    'orderDetails.details': 'รายละเอียดคำสั่งซื้อ',
    'orderDetails.print': 'พิมพ์',
    'orderDetails.date': 'วันที่สั่งซื้อ',
    'orderDetails.time': 'เวลาสั่งซื้อ',
    'orderDetails.payment': 'การชำระเงิน',
    'orderDetails.paymentMethod': 'เงินสดเมื่อรับสินค้า',
    'orderDetails.specialInstructions': 'คำแนะนำพิเศษ',
    'orderDetails.totalAmount': 'จำนวนเงินรวม',
    'orderDetails.each': 'ต่อชิ้น',
    
    // Sales
    'sales.title': 'แดชบอร์ดยอดขาย',
    'sales.totalOrders': 'คำสั่งซื้อทั้งหมด',
    'sales.totalRevenue': 'รายได้รวม',
    'sales.avgOrderValue': 'มูลค่าเฉลี่ยต่อคำสั่งซื้อ',
    'sales.date': 'วันที่',
    'sales.topItems': 'สินค้าขายดี',
    'sales.export': 'ส่งออก',
    'sales.insights': 'ข้อมูลเชิงลึกการขาย',
    'sales.performance': 'ประสิทธิภาพ',
    'sales.noData': 'ไม่มีข้อมูลยอดขาย',
    
    // Menu
    'menu.title': 'จัดการเมนู',
    'menu.addItem': 'เพิ่มรายการ',
    'menu.search': 'ค้นหารายการเมนู...',
    'menu.allCategories': 'หมวดหมู่ทั้งหมด',
    'menu.allItems': 'รายการทั้งหมด',
    'menu.availableOnly': 'ที่มีอยู่เท่านั้น',
    'menu.unavailableOnly': 'ที่ไม่มีเท่านั้น',
    'menu.available': 'มีอยู่',
    'menu.unavailable': 'ไม่มี',
    'menu.hide': 'ซ่อน',
    'menu.show': 'แสดง',
    'menu.noItems': 'ไม่พบรายการเมนู',
    
    // Common
    'common.loading': 'กำลังโหลด...',
    'common.error': 'ข้อผิดพลาด',
    'common.success': 'สำเร็จ',
    'common.cancel': 'ยกเลิก',
    'common.save': 'บันทึก',
    'common.delete': 'ลบ',
    'common.edit': 'แก้ไข',
    'common.back': 'ย้อนกลับ',
    'common.na': 'ไม่มีข้อมูล',
    'common.phone': 'โทรศัพท์',
    'common.email': 'อีเมล',
    'common.name': 'ชื่อ',
    'common.customer': 'ลูกค้า',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'th'; // Default to Thai
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};