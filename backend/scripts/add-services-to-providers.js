import 'dotenv/config';
import { db } from '../src/config/firebase.js';

const SERVICES_BY_CATEGORY = {
  'AC_REPAIR': [
    { id: 'ac_01', name: 'AC General Service', price: 2500, duration_mins: 60, description: 'Complete AC cleaning and gas check' },
    { id: 'ac_02', name: 'AC Gas Refill', price: 3500, duration_mins: 45, description: 'Refrigerant refill for optimal cooling' },
    { id: 'ac_03', name: 'AC Installation (1 ton)', price: 4500, duration_mins: 120, description: 'Full installation with pipe fitting' },
    { id: 'ac_04', name: 'AC Installation (1.5 ton)', price: 5500, duration_mins: 150, description: 'Full installation with pipe fitting' },
    { id: 'ac_05', name: 'AC Repair - Compressor', price: 8000, duration_mins: 90, description: 'Compressor diagnosis and repair' },
    { id: 'ac_06', name: 'AC Remote Repair', price: 800, duration_mins: 30, description: 'Remote control repair or replacement' },
  ],
  'ELECTRICIAN': [
    { id: 'el_01', name: 'Wiring Inspection', price: 1500, duration_mins: 45, description: 'Complete home wiring checkup' },
    { id: 'el_02', name: 'Switch/Socket Installation', price: 500, duration_mins: 30, description: 'Per switch or socket installation' },
    { id: 'el_03', name: 'Fan Installation', price: 800, duration_mins: 30, description: 'Ceiling fan fitting and wiring' },
    { id: 'el_04', name: 'MCB/Fuse Replacement', price: 1200, duration_mins: 30, description: 'Circuit breaker replacement' },
    { id: 'el_05', name: 'Inverter/UPS Installation', price: 2000, duration_mins: 60, description: 'UPS wiring and installation' },
    { id: 'el_06', name: 'Complete Rewiring', price: 15000, duration_mins: 480, description: 'Full home rewiring (per room pricing)' },
  ],
  'PLUMBER': [
    { id: 'pl_01', name: 'Pipe Leak Repair', price: 1200, duration_mins: 45, description: 'Fix leaking pipes and joints' },
    { id: 'pl_02', name: 'Tap/Faucet Replacement', price: 800, duration_mins: 30, description: 'New tap installation' },
    { id: 'pl_03', name: 'Toilet Repair', price: 1500, duration_mins: 60, description: 'Flush system and seat repair' },
    { id: 'pl_04', name: 'Water Motor Installation', price: 3500, duration_mins: 90, description: 'Submersible or surface pump' },
    { id: 'pl_05', name: 'Drain Cleaning', price: 2000, duration_mins: 60, description: 'Blocked drain clearing' },
    { id: 'pl_06', name: 'Geyser Installation', price: 2500, duration_mins: 60, description: 'Water heater fitting and plumbing' },
  ],
  'CARPENTER': [
    { id: 'ca_01', name: 'Door Repair', price: 1500, duration_mins: 60, description: 'Door fitting, lock, or hinge repair' },
    { id: 'ca_02', name: 'Furniture Repair', price: 2000, duration_mins: 90, description: 'Chair, table, or cabinet repair' },
    { id: 'ca_03', name: 'Kitchen Cabinet Work', price: 5000, duration_mins: 180, description: 'Cabinet installation or repair' },
    { id: 'ca_04', name: 'Wardrobe Installation', price: 8000, duration_mins: 240, description: 'Built-in wardrobe fitting' },
    { id: 'ca_05', name: 'Window Repair', price: 1200, duration_mins: 45, description: 'Window frame and lock repair' },
  ],
  'PAINTER': [
    { id: 'pa_01', name: 'Room Painting (1 room)', price: 4000, duration_mins: 240, description: 'Wall and ceiling painting' },
    { id: 'pa_02', name: 'Exterior Wall Painting', price: 8000, duration_mins: 480, description: 'Outside wall per 100 sqft' },
    { id: 'pa_03', name: 'Texture Painting', price: 6000, duration_mins: 300, description: 'Decorative texture per room' },
    { id: 'pa_04', name: 'Touch-up Work', price: 1500, duration_mins: 120, description: 'Small patch and touch-up' },
  ],
  'TUTOR': [
    { id: 'tu_01', name: 'Maths Tutoring (1 hour)', price: 1500, duration_mins: 60, description: 'O/A level or matric maths' },
    { id: 'tu_02', name: 'Physics Tutoring (1 hour)', price: 1500, duration_mins: 60, description: 'O/A level or matric physics' },
    { id: 'tu_03', name: 'English Tutoring (1 hour)', price: 1200, duration_mins: 60, description: 'Grammar, writing, and speaking' },
    { id: 'tu_04', name: 'Chemistry Tutoring (1 hour)', price: 1500, duration_mins: 60, description: 'O/A level or matric chemistry' },
    { id: 'tu_05', name: 'Monthly Package (20 sessions)', price: 20000, duration_mins: 60, description: 'Daily 1-hour sessions for a month' },
  ],
  'BEAUTICIAN': [
    { id: 'be_01', name: 'Basic Facial', price: 2000, duration_mins: 60, description: 'Cleansing and moisturizing facial' },
    { id: 'be_02', name: 'Bridal Makeup', price: 15000, duration_mins: 180, description: 'Complete bridal look with hairstyle' },
    { id: 'be_03', name: 'Threading (Full Face)', price: 500, duration_mins: 30, description: 'Eyebrow and full face threading' },
    { id: 'be_04', name: 'Waxing (Full Body)', price: 3000, duration_mins: 90, description: 'Full body waxing service' },
    { id: 'be_05', name: 'Hair Color', price: 4000, duration_mins: 120, description: 'Global hair color with treatment' },
  ],
  'CLEANER': [
    { id: 'cl_01', name: 'Home Deep Clean (2BHK)', price: 5000, duration_mins: 240, description: 'Full apartment deep cleaning' },
    { id: 'cl_02', name: 'Kitchen Deep Clean', price: 2500, duration_mins: 120, description: 'Stove, tiles, cabinets cleaning' },
    { id: 'cl_03', name: 'Sofa/Carpet Cleaning', price: 3000, duration_mins: 120, description: 'Steam cleaning per sofa set' },
    { id: 'cl_04', name: 'Post-Construction Clean', price: 8000, duration_mins: 360, description: 'Debris and dust removal after work' },
  ],
  'DRIVER': [
    { id: 'dr_01', name: 'Airport Transfer', price: 2000, duration_mins: 60, description: 'One-way airport drop or pickup' },
    { id: 'dr_02', name: 'Monthly Driver Service', price: 30000, duration_mins: 0, description: '8 hours/day dedicated driver' },
    { id: 'dr_03', name: 'Outstation Trip (per day)', price: 5000, duration_mins: 480, description: 'Full day outstation driving' },
  ],
  'GARDENER': [
    { id: 'ga_01', name: 'Garden Trimming', price: 1500, duration_mins: 120, description: 'Hedge and grass trimming' },
    { id: 'ga_02', name: 'Garden Setup', price: 5000, duration_mins: 240, description: 'New garden layout and planting' },
    { id: 'ga_03', name: 'Plant Repotting', price: 800, duration_mins: 60, description: 'Per plant repotting service' },
  ],
};

async function run() {
  try {
    const snapshot = await db.collection('providers').get();
    console.log(`Found ${snapshot.size} providers in Firestore.`);
    
    for (const doc of snapshot.docs) {
      const providerData = doc.data();
      const categories = providerData.service_categories || [];
      
      // Build services array
      let services = [];
      categories.forEach(cat => {
        if (SERVICES_BY_CATEGORY[cat]) {
          services = [...services, ...SERVICES_BY_CATEGORY[cat]];
        }
      });
      
      // Update doc
      await db.collection('providers').doc(doc.id).update({
        services,
        booked_slots: providerData.booked_slots || []
      });
      console.log(`✅ Updated provider: ${providerData.name} (ID: ${doc.id}) with ${services.length} services.`);
    }
    console.log('🎉 All providers updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating providers:', error);
    process.exit(1);
  }
}

run();
