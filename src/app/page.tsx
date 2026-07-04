export default function Home() {
  return (
    <div>
      <h1>🎬 استودیوی تبلیغاتی شخصی</h1>
      <p className="sub">
        عکس تبلیغاتی، ریلز، تیزر، ویدیو UGC و اینفلوئنسر مجازی — بدون نوشتن پرامپت، فقط با انتخاب.
      </p>

      <div className="home-tiles">
        <a className="card" href="/identities">
          <div className="icon">🧑</div>
          <h2>۱. افراد</h2>
          <p className="sub">عکس‌های شخص واقعی را اضافه کن تا اینفلوئنسر AI با همان چهره و بدن ساخته شود.</p>
        </a>
        <a className="card" href="/products">
          <div className="icon">📦</div>
          <h2>۲. محصولات</h2>
          <p className="sub">موتورسیکلت، لباس، کیف، لوازم آرایشی… عکس و مشخصات محصول را ذخیره کن.</p>
        </a>
        <a className="card" href="/brands">
          <div className="icon">🎨</div>
          <h2>۳. برند</h2>
          <p className="sub">رنگ، لوگو، سبک بصری و لحن تبلیغاتی برندت را یک بار تعریف کن.</p>
        </a>
        <a className="card" href="/create">
          <div className="icon">✨</div>
          <h2>۴. ساخت محتوا</h2>
          <p className="sub">نوع خروجی، صحنه، نور، دوربین و سبک را انتخاب کن — بقیه‌اش با سیستم.</p>
        </a>
        <a className="card" href="/outputs">
          <div className="icon">🗂️</div>
          <h2>۵. خروجی‌ها</h2>
          <p className="sub">همه تولیدها، پرامپت‌ها و چک‌لیست کنترل کیفیت هر خروجی اینجاست.</p>
        </a>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2>شروع سریع</h2>
        <ol style={{ paddingInlineStart: 20, fontSize: 14, color: 'var(--muted)' }}>
          <li>در صفحه «افراد» یک نفر را با ۱۰-۱۵ عکس مرجع اضافه کن.</li>
          <li>در صفحه «محصولات» محصولت را با چند عکس تمیز ثبت کن.</li>
          <li>به «ساخت محتوا» برو، گزینه‌ها را انتخاب کن و «ساخت پرامپت» را بزن.</li>
          <li>
            اگر کلید <code>FAL_KEY</code> را در <code>.env.local</code> گذاشته باشی، دکمه «تولید» خروجی
            واقعی می‌سازد؛ وگرنه بسته پرامپت آماده را کپی کن و در هر ابزاری استفاده کن.
          </li>
        </ol>
      </div>
    </div>
  );
}
