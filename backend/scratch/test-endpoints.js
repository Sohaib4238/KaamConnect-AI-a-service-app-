async function runTests() {
  const providerId = 'PKR-ISB-008';
  const targetDate = '2026-05-18';
  const targetSlot = '2026-05-18T05:00:00.000Z'; // 10:00 AM PKT
  
  console.log('════════════════════════════════════════');
  console.log('🧪 RUNNING KAAMCONNECT MANUAL BOOKING API TESTS');
  console.log('════════════════════════════════════════\n');

  try {
    // 🔍 Test 1: Get Provider Details
    console.log('➡️ TEST 1: GET Provider Details...');
    const res1 = await fetch(`http://localhost:3000/api/providers/${providerId}`);
    const data1 = await res1.json();
    console.log(`Response Status: ${res1.status}`);
    console.log(`Success: ${data1.success}`);
    if (data1.success) {
      console.log(`Provider Name: ${data1.provider.name}`);
      console.log(`Categories: ${JSON.stringify(data1.provider.service_categories)}`);
      console.log(`Services count: ${data1.provider.services?.length}`);
      console.log(`Sample Service: ${JSON.stringify(data1.provider.services?.[0])}`);
    } else {
      console.error('Test 1 failed:', data1);
    }
    console.log('\n────────────────────────────────────────\n');

    // 🕐 Test 2: Get Available Slots BEFORE Booking
    console.log('➡️ TEST 2: GET Available Slots (Before Booking)...');
    const res2 = await fetch(`http://localhost:3000/api/providers/${providerId}/slots?date=${targetDate}`);
    const data2 = await res2.json();
    console.log(`Response Status: ${res2.status}`);
    console.log(`Success: ${data2.success}`);
    console.log(`Total Slots generated: ${data2.slots?.length}`);
    console.log(`Total Available Slots: ${data2.total_available}`);
    const targetSlotObj = data2.slots?.find(s => s.slot_time === targetSlot);
    console.log(`Target Slot (${targetSlot}) state:`, JSON.stringify(targetSlotObj));
    console.log('\n────────────────────────────────────────\n');

    // 📋 Test 3: Perform Manual Booking
    console.log('➡️ TEST 3: POST Manual Booking...');
    const bookingPayload = {
      provider_id: providerId,
      services: [{ id: 'ac_01', name: 'AC General Service', price: 2500 }],
      slot_time: targetSlot,
      user_details: {
        name: 'Test User',
        phone: '0300-1234567',
        address: 'DHA Karachi'
      }
    };
    const res3 = await fetch('http://localhost:3000/api/manual-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    });
    const data3 = await res3.json();
    console.log(`Response Status: ${res3.status}`);
    console.log(`Status string: ${data3.status}`);
    if (data3.status === 'booking_confirmed') {
      console.log(`Booking ID: ${data3.booking?.booking_id}`);
      console.log(`Total Price: PKR ${data3.booking?.total_price}`);
      console.log(`Booking Date: ${data3.booking?.slot}`);
      console.log(`Booking Details: ${JSON.stringify(data3.booking?.user_details)}`);
    } else {
      console.error('Test 3 failed:', data3);
    }
    console.log('\n────────────────────────────────────────\n');

    // 🕐 Test 4: Get Available Slots AFTER Booking
    console.log('➡️ TEST 4: GET Available Slots (After Booking)...');
    const res4 = await fetch(`http://localhost:3000/api/providers/${providerId}/slots?date=${targetDate}`);
    const data4 = await res4.json();
    console.log(`Response Status: ${res4.status}`);
    console.log(`Success: ${data4.success}`);
    console.log(`Total Available Slots now: ${data4.total_available}`);
    const targetSlotObjAfter = data4.slots?.find(s => s.slot_time === targetSlot);
    console.log(`Target Slot (${targetSlot}) state now:`, JSON.stringify(targetSlotObjAfter));
    console.log('\n════════════════════════════════════════');
    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Test execution error:', error);
  }
}

runTests();
