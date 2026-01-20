<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth-store';
import { onMounted } from 'vue';

const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
  await authStore.authorizeUser();
});

const signinButton = () => {
  void router.push({ name: 'login' });
};

const signupButton = () => {
  void router.push({ name: 'register' });
};

// For the role-based features section
const roleFeatures = [
  {
    role: 'For Students',
    icon: 'school',
    features: [
      'View all your classes in one place',
      'Check your attendance records',
      'Receive notifications for class changes',
      'Submit attendance via QR code',
      'Access attendance history for all courses',
    ],
  },
  {
    role: 'For Teachers',
    icon: 'assignment_ind',
    features: [
      'Manage multiple classes easily',
      'Take attendance with one click',
      'Generate QR codes for class sessions',
      'View detailed attendance reports',
      'Communicate with students directly',
    ],
  },
  {
    role: 'For Department Heads',
    icon: 'supervisor_account',
    features: [
      'Monitor attendance across all courses',
      'Generate department-wide reports',
      'Track faculty performance metrics',
      'Set attendance policies and thresholds',
      'Get real-time insights on attendance trends',
    ],
  },
  {
    role: 'For Administrators',
    icon: 'admin_panel_settings',
    features: [
      'Manage all users and permissions',
      'Configure system-wide settings',
      'Access comprehensive analytics',
      'Generate institution-wide reports',
      'Integrate with existing systems',
    ],
  },
];

// For testimonials
const testimonials = [
  {
    name: 'Bin Jamal Abduljalel',
    role: 'Scrum Master',
    image:
      'https://lh3.googleusercontent.com/a-/ALV-UjVlsihMIjso3l6UKsjQX4ySkOAz-rqaUTX0bPJkUTKd4a9XD0k=s96-c',
    rating: 5,
    quote:
      'The attendance system is very efficient and has saved me a lot of time. It’s a great tool for students.',
  },
  {
    name: 'Xandryl Lou Saycon',
    role: 'Product Owner',
    image:
      'https://lh3.googleusercontent.com/a-/ALV-UjUHuy_Ys0CJczGtQs6OTs352zyFFV3di09cfvuFzMXQkag6xv8EUQ=s96-c',
    rating: 5,
    quote:
      'The analytics dashboard gives me valuable insights into attendance patterns across all courses.',
  },
  {
    name: 'Somaimah Ampaso',
    role: 'Quality Assurance',
    image:
      'https://lh3.googleusercontent.com/a-/ALV-UjVOB8ZBfthXCP_bguljbE5Kt7UcOekb9FL2rbRJximvvt2qT47G=s96-c',
    rating: 5,
    quote:
      'The mobile app makes it so easy to check in for classes. I never have to worry about missing attendance anymore.',
  },
  {
    name: 'Jonaidah Caris',
    role: 'Quality Assurance',
    image:
      'https://lh3.googleusercontent.com/a-/ALV-UjVLIDXGWC6ObsvLFVnsPRN7zopz4Uzd4ZOYlvmfeU6wPaX4rG4rNOiCrrfFYbidNYl-TrbhGtlxbOqH8Ap95tx90msF0Ob1Co0ICIATUUyhW9q3muoeMxvSJr5FNBIIYiFUe8E9weePMHbzRM5LZJx96e8Re1fCTLb-rwsJYgSAjrFQuh-HitB9AZeGP8WJsfFu9MH6-aKJpAe9aqwS06CrCZox0Nq_4dO0EvI9L1qqqOUr_g1Pjggq7x0gBHmwNIzqLh_f8sybDfMAo9MBY_kkj4KrdA8vs4tO5691LzOwnWAEvd5L9zKuJop7QobgwX38B6T3uyWNXmbTbHz7wxcLMyAFTSyGHbhxbYe7MYDDO0-cHpIKhm5s_Gg06NIVkh627S-DxseX1E_xa58j35PpH6lUzh_9Texy6gOGqPeqVd2FE4NxTarjH11QLn9ikwkOVL2eyYhgLMGASUAGEhRGy_629OwU0sEorsQf9tOiG8J6qcNpt0pcaH_i8cbI0-VKnVAc_ZBAELF181cCaNHtV3hpAlIqdemTQJ_Ugmbzl3tlcKFD9IH8br9AbuO6Hie5Rz8mq4Vm_G1wxolqg4ijNs4Bp6rbcpdGrko0HZIOXkH5ES63-72de65MG6EDkRNtcldplxQAJMY5eiCGW7anrNQRhhlaGB84tNBLZIJKwHZuImWg10CFkCXEii6uBLOT4gWS0LR-u0WGvx7cfERlJfdBec-jkbb08PsxkhuzI_HFqn5Hw1TqnyVSXQv0c43bLdUbkvQOfINpFOTvFX0qch6R1ia9XFfTkNbFcVZ2wkEfSt8qMsjz-6u3zRTB8W3eV-fuauJmwPjTL7iTT5fO0dFTYGlY3n8GXRMGOOynfy2yTfb5FuWudKIO4zwRBSXEk2glm9xANdjgCcG4WsvY1xmXt4OZZefEyF6YGEV0ztzZwkkCcZkk_r71V1fiXyYe_PVD1WdsStWfEnQKn3OFJC6bKigmcg=s96-c',
    rating: 5,
    quote:
      'The attendance tracking system has transformed my classroom management. My students appreciate the efficient approach!',
  },
  {
    name: 'Janisah Macarimbang',
    role: 'Quality Assurance',
    image:
      'https://lh3.googleusercontent.com/a/ACg8ocJ6kQdqqeO0ihCY6-JQJ-mpdifPjdg_aFNij6fn09EqzYcofA=s96-c-mo',
    rating: 5,
    quote:
      'Managing user permissions and monitoring system usage has never been easier. The admin dashboard is intuitive and powerful.',
  },
  {
    name: 'Mohaymen Omar',
    role: 'Developer',
    image:
      'https://lh3.googleusercontent.com/a/ACg8ocJXxAYoLL8jr6Thv6ME3C_l5zknqDfUSQGRUPOg_PcpG-_wvLo0=s96-c',
    rating: 5,
    quote:
      'I really enjoyed using the web app as it made my work easier! I love how it organizes my classes.',
  },
  {
    name: 'Omar Batocala',
    role: 'Developer',
    image:
      'https://lh3.googleusercontent.com/a-/ALV-UjXG2lyEv3nfTmLXr-UAx-21iq78OGuICRLf5T6V8nFTwy6SGTA=s96-c',
    rating: 5,
    quote:
      'Being able to check my attendance history for all courses in one place has been incredibly helpful.',
  },
  {
    name: 'Sarhan Mundig',
    role: 'Developer',
    image:
      'https://lh3.googleusercontent.com/a-/ALV-UjXpacO_OK2NGnka6jxYPXd-iUNvk2G62kqyA-xciJFPtoSvHDM=s96-c',
    rating: 5,
    quote:
      'Taking attendance is now quick and efficient. The detailed reports help me identify attendance patterns easily.',
  },
  {
    name: 'Rafael Panalondong',
    role: 'Developer',
    image:
      'https://lh3.googleusercontent.com/a-/ALV-UjWC7CfQfd5HNC0zleMloSNUtHVPaxwb8fXyEtU55tBrccPZVYY=s96-c',
    rating: 5,
    quote:
      'The institution-wide analytics have transformed how we track and improve attendance across departments.',
  },
  {
    name: 'Amal Sultan',
    role: 'Developer',
    image:
      'https://lh3.googleusercontent.com/a-/ALV-UjWP0P00BAHC2TsW2WpKGAk4jhlYDCKYmhlpKARrsFwpW7NDyCU=s96-c',
    rating: 5,
    quote:
      'The platform is user-friendly and helps me stay on top of my attendance and class schedules.',
  },
  {
    name: 'Abdul Bari Azis',
    role: 'Developer',
    image:
      'https://lh3.googleusercontent.com/a/ACg8ocIVCZE9modXDFg6Xlm9gk1geAI5B3WQ0RTLeKMF5bRkvzDO7Q=s96-c-mo',
    rating: 5,
    quote:
      'The system has streamlined my workflow completely. I can focus more on teaching and less on administrative tasks.',
  },
];

// For statistics section
const statistics = [
  {
    value: '96%',
    label: 'Attendance Rate',
  },
  {
    value: '+5083',
    label: 'Active Students',
  },
  {
    value: '86%',
    label: 'Time Saved',
  },
  {
    value: '100%',
    label: 'User Satisfaction',
  },
];

// For access portal links
const portalLinks = [
  { label: 'Student Portal', icon: 'school', link: '/login' },
  { label: 'Teacher Portal', icon: 'assignment_ind', link: '/login' },
  { label: 'Department Portal', icon: 'supervisor_account', link: '/login' },
  { label: 'Admin Portal', icon: 'admin_panel_settings', link: '/login' },
];
</script>

<template>
  <q-page>
    <!-- Hero Section -->
    <section id="home" class="hero-section">
      <div class="container">
        <div class="row items-center">
          <div class="col-12 col-md-6 text-center text-md-left">
            <h1 class="text-h2 text-weight-bold q-mb-md">Q-attendance System</h1>
            <p class="text-body1 q-mb-lg">
              Centralize all your attendance tracking in a single, intuitive application with
              real-time updates and detailed analytics.
            </p>
            <div class="q-gutter-md">
              <div v-if="authStore.currentAccounts">
                <q-btn
                  v-if="authStore.currentAccounts.length == 0"
                  unelevated
                  color="primary"
                  no-caps
                  :to="{ name: 'apply-for-role' }"
                  >Apply for Role</q-btn
                >
                <q-btn-dropdown v-else color="primary" label="Dashboard">
                  <q-list>
                    <q-item
                      v-for="account in authStore.currentAccounts"
                      :key="account.key"
                      clickable
                      v-close-popup
                      :to="{ name: account.role }"
                    >
                      <q-item-section>
                        <q-item-label class="text-capitalize">{{ account.role }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item :to="{ name: 'apply-for-role' }">
                      <q-item-section>
                        <q-item-label>Apply for Role</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
              <div v-else class="row q-col-gutter-md">
                <div class="col-12 col-sm-auto">
                  <q-btn size="lg" color="primary" label="Get Started" @click="signupButton" />
                </div>
                <div class="col-12 col-sm-auto">
                  <q-btn size="lg" outline color="primary" label="Sign In" @click="signinButton" />
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-6 text-center q-pt-md q-pt-md-none">
            <!-- Mobile App Mockup -->
            <div class="phone-mockup">
              <div class="phone-header">
                <div class="header-content">
                  <q-icon name="menu" size="sm" />
                  <div class="logo-container">
                    <span class="user-greeting">Hi, Nami</span>
                  </div>
                  <div>
                    <q-icon name="add" size="sm" class="add-icon" />
                    <q-avatar size="24px">
                      <img src="https://cdn.quasar.dev/img/avatar4.jpg" />
                    </q-avatar>
                  </div>
                </div>
              </div>
              <div class="phone-content">
                <div class="class-list">
                  <div class="class-card">
                    <div class="class-header blue-header">
                      <div>
                        <div class="class-code">CCC181</div>
                        <div class="class-section">*</div>
                      </div>
                      <q-icon name="more_vert" size="sm" />
                    </div>
                    <div class="class-details">
                      <div class="class-info">Class Code: 3L8G</div>
                      <div class="teacher-info">Monkey D. Luffy</div>
                    </div>
                  </div>

                  <div class="class-card">
                    <div class="class-header green-header">
                      <div>
                        <div class="class-code">ITD104</div>
                        <div class="class-section">PpQq</div>
                      </div>
                      <q-icon name="more_vert" size="sm" />
                    </div>
                    <div class="class-details">
                      <div class="class-info">Class Code: WOM1</div>
                      <div class="teacher-info">Roronoa Zoro</div>
                    </div>
                  </div>

                  <div class="class-card">
                    <div class="class-header yellow-header">
                      <div>
                        <div class="class-code">ITE125</div>
                        <div class="class-section">WwXx</div>
                      </div>
                      <q-icon name="more_vert" size="sm" />
                    </div>
                    <div class="class-details">
                      <div class="class-info">Class Code: DA8I</div>
                      <div class="teacher-info">Nami</div>
                    </div>
                  </div>

                  <div class="class-card">
                    <div class="class-header light-blue-header">
                      <div>
                        <div class="class-code">ITE132</div>
                        <div class="class-section">YyZz</div>
                      </div>
                      <q-icon name="more_vert" size="sm" />
                    </div>
                    <div class="class-details">
                      <div class="class-info">Class Code: HJ2L</div>
                      <div class="teacher-info">Sanji</div>
                    </div>
                  </div>

                  <div class="class-card">
                    <div class="class-header purple-header">
                      <div>
                        <div class="class-code">ITE153</div>
                        <div class="class-section">FfGg</div>
                      </div>
                      <q-icon name="more_vert" size="sm" />
                    </div>
                    <div class="class-details">
                      <div class="class-info">Class Code: UJ7R</div>
                      <div class="teacher-info">Nico Robin</div>
                    </div>
                  </div>

                  <div class="class-card">
                    <div class="class-header teal-header">
                      <div>
                        <div class="class-code">ITE182</div>
                        <div class="class-section">Mm</div>
                      </div>
                      <q-icon name="more_vert" size="sm" />
                    </div>
                    <div class="class-details">
                      <div class="class-info">Class Code: QW9N</div>
                      <div class="teacher-info">Usopp</div>
                    </div>
                  </div>

                  <div class="class-card">
                    <div class="class-header brown-header">
                      <div>
                        <div class="class-code">STT071</div>
                        <div class="class-section">Cc</div>
                      </div>
                      <q-icon name="more_vert" size="sm" />
                    </div>
                    <div class="class-details">
                      <div class="class-info">Class Code: VR2P</div>
                      <div class="teacher-info">Tony Chopper</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Role-Based Features Section -->
    <section id="features" class="role-features-section">
      <div class="container">
        <div class="text-center q-mb-xl">
          <h2 class="text-h3 text-weight-bold q-mb-md">Role-Based Features</h2>
          <p class="text-body1 q-mx-auto" style="max-width: 700px">
            Q-attedance System is designed to cater to the needs of different roles for more
            effective and productive attendance management.
          </p>
        </div>

        <div class="row q-col-gutter-lg">
          <div
            v-for="(roleFeature, index) in roleFeatures"
            :key="index"
            class="col-12 col-sm-6 col-md-3"
          >
            <q-card class="role-feature-card">
              <q-card-section class="text-center">
                <q-icon :name="roleFeature.icon" size="3rem" color="primary" />
                <h3 class="text-h5 text-weight-bold q-mt-md">{{ roleFeature.role }}</h3>
                <q-list dense>
                  <q-item
                    v-for="(feature, featureIndex) in roleFeature.features"
                    :key="featureIndex"
                  >
                    <q-item-section avatar>
                      <q-icon name="check" color="positive" size="xs" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ feature }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section id="about" class="stats-section">
      <div class="container">
        <h2 class="text-h3 text-weight-bold text-center q-mb-xl">Proven Results</h2>
        <div class="row q-col-gutter-md">
          <div v-for="(stat, index) in statistics" :key="index" class="col-6 col-md-3">
            <div class="stat-card text-center">
              <div class="text-h2 text-weight-bold text-white">{{ stat.value }}</div>
              <div class="text-subtitle1 text-white">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials-section">
      <div class="container">
        <h2 class="text-h4 text-weight-bold text-center q-mb-xl">What Our Users Say</h2>
        <div class="row q-col-gutter-lg">
          <div v-for="(testimonial, index) in testimonials" :key="index" class="col-12 col-md-4">
            <q-card class="testimonial-card q-mb-lg">
              <q-card-section class="text-center">
                <q-avatar size="64px" class="q-mb-md">
                  <img :src="testimonial.image" :alt="testimonial.name" />
                </q-avatar>
                <div class="text-h6 text-weight-bold">{{ testimonial.name }}</div>
                <div class="text-caption text-grey-7 q-mb-sm">{{ testimonial.role }}</div>
                <div class="rating q-mb-sm">
                  <q-icon
                    v-for="n in testimonial.rating"
                    :key="n"
                    name="star"
                    color="amber"
                    size="18px"
                  />
                </div>
                <div class="q-mt-sm">{{ testimonial.quote }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer Section -->
    <section id="contact" class="footer-section">
      <div class="container">
        <div class="row q-col-gutter-xl">
          <div class="col-12 col-md-4">
            <h4 class="text-h6 text-weight-bold">Contact Us</h4>
            <p class="q-mb-xs">
              <q-icon name="email" size="xs" class="q-mr-sm" />
              info@q-attedance.com
            </p>
            <p class="q-mb-xs">
              <q-icon name="phone" size="xs" class="q-mr-sm" />
              +1-800-555-0123
            </p>
          </div>

          <div class="col-12 col-md-8">
            <h4 class="text-h6 text-weight-bold">Access Portal</h4>
            <div class="row q-col-gutter-md">
              <div
                v-for="(portal, index) in portalLinks"
                :key="index"
                class="col-12 col-sm-6 col-md-3"
              >
                <q-btn
                  outline
                  color="white"
                  :label="portal.label"
                  :icon="portal.icon"
                  :to="portal.link"
                  class="full-width"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="row copyright-section q-mt-xl">
          <div class="col-12 text-center">
            <p class="text-caption q-mb-none">
              © {{ new Date().getFullYear() }} Q-attedance System • All rights reserved
            </p>
          </div>
        </div>
      </div>
    </section>
  </q-page>
</template>

<style lang="scss">
// General Styles
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

section {
  padding: 5rem 0;
}

// Primary color
$primary-color: #790622;

// Hero Section
.hero-section {
  background: #ffffff;
  min-height: 80vh;
  display: flex;
  align-items: center;

  h1 {
    color: $primary-color;
    line-height: 1.2;
  }

  p {
    color: #666;
    max-width: 500px;
  }

  // Phone mockup styling
  .phone-mockup {
    width: 320px;
    height: 640px;
    background-color: #f5f5f5;
    border-radius: 30px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    border: 8px solid #fff;
    margin: 0 auto;
    position: relative;

    .phone-header {
      background-color: #fff;
      color: $primary-color;
      padding: 15px;
      position: relative;
      border-bottom: 1px solid #eee;

      .header-content {
        display: flex;
        justify-content: space-between;
      }

      .logo-container {
        display: flex;
        align-items: left;
        gap: 8px;

        .logo-icon {
          background-color: #e3f2fd;
          border-radius: 50%;
          padding: 4px;
        }

        .user-greeting {
          font-weight: 500;
          color: $primary-color;
        }
      }

      .add-icon {
        color: #757575;
      }
    }

    .phone-content {
      padding: 15px;
      background-color: #f5f5f5;
      height: calc(100% - 60px);
      overflow-y: auto;

      .class-list {
        display: flex;
        flex-direction: column;
        gap: 15px;

        .class-card {
          background-color: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

          .class-header {
            padding: 15px;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;

            .class-code {
              font-size: 1.2rem;
              font-weight: bold;
              margin-bottom: 4px;
            }

            .class-section {
              font-size: 0.9rem;
              opacity: 0.9;
            }

            &.blue-header {
              background-color: #1a73e8;
            }

            &.light-blue-header {
              background-color: #4285f4;
            }

            &.green-header {
              background-color: #34a853;
            }

            &.yellow-header {
              background-color: #fbbc04;
            }

            &.purple-header {
              background-color: #9c27b0;
            }

            &.teal-header {
              background-color: #0097a7;
            }

            &.brown-header {
              background-color: #795548;
            }

            &.primary-header {
              background-color: $primary-color;
            }
          }

          .class-details {
            padding: 15px;

            .class-info {
              font-size: 0.9rem;
              color: #333;
              margin-bottom: 8px;
            }

            .teacher-info {
              font-size: 0.9rem;
              color: #666;
            }
          }
        }
      }
    }
  }
}

// Role Features Section
.role-features-section {
  background-color: #fff;

  .role-feature-card {
    height: 100%;
    border-radius: 12px;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
    border: 1px solid #eee;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
    }

    .q-icon {
      color: $primary-color;
    }

    h3 {
      color: $primary-color;
    }

    .q-list {
      margin-top: 1rem;
    }
  }
}

// Demo Section
.demo-section {
  background-color: #f9f9f9;

  .demo-card {
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
  }
}

// Class Code Section
.class-code-section {
  background-color: #fff;

  .class-code-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);

    .q-card-section {
      padding: 2rem;
    }
  }
}

// Testimonials Section
.testimonials-section {
  background-color: #f9f9f9;

  .testimonial-card {
    border-radius: 12px;
    transition: transform 0.3s ease;
    border: 1px solid #eee;
    overflow: hidden;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
    }

    .rating {
      display: flex;
      gap: 2px;
    }
  }
}

// Stats Section
.stats-section {
  background-color: $primary-color;
  color: white;
  padding: 3rem 0;

  .stat-card {
    padding: 2rem 1rem;
    text-align: center;

    .text-h2 {
      font-size: 2.5rem;
      line-height: 1;
      margin-bottom: 0.5rem;
    }
  }
}

// Footer Section
.footer-section {
  background-color: $primary-color;
  color: white;
  padding: 4rem 0 2rem;

  h4 {
    margin-bottom: 1.5rem;
  }

  .copyright-section {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 1.5rem;
    margin-top: 1.5rem;
  }
}

// Responsive Adjustments
@media (max-width: 767px) {
  section {
    padding: 3rem 0;
  }

  .hero-section {
    min-height: auto;
    padding-top: 2rem;
    text-align: center;

    h1 {
      font-size: 2.5rem;
    }

    .phone-mockup {
      margin-top: 2rem;
      width: 280px;
      height: 560px;
    }
  }

  .stats-section .stat-card .text-h2 {
    font-size: 2rem;
  }
}
</style>
