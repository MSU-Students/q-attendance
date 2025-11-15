<script setup lang="ts">
import { copyToClipboard, date, Notify, uid, useQuasar } from 'quasar';
import { useClassStore } from 'src/stores/class-store';
import { useAuthStore } from 'src/stores/auth-store';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ClassModel } from 'src/models/class.models';
import { useRouter } from 'vue-router';

const classStore = useClassStore();
const authStore = useAuthStore();
const router = useRouter();
const $q = useQuasar();

const showNewClassDialog = ref(false);
const className = ref('');
const classSection = ref('');

const teacherClasses = computed(() => {
  return classStore.teaching;
});

onMounted(async () => {
  await classStore.loadUserClasses(authStore.currentAccount?.key || '');

  window.addEventListener('open-create-class-dialog', addNewClass);
});

onUnmounted(() => {
  window.removeEventListener('open-create-class-dialog', addNewClass);
});

function addNewClass() {
  showNewClassDialog.value = true;
}

async function saveClass() {
  if (authStore.currentAccount) {
    Notify.create({
      message: 'You added a new class',
      color: 'green',
      icon: 'check',
      position: 'top',
      timeout: 2000,
    });
    const newClass: ClassModel = {
      key: uid(),
      name: className.value,
      academicYear: date.formatDate(new Date(), 'YYYY'),
      classCode: Math.random().toString(36).substring(2, 6).toUpperCase(),
      section: classSection.value,
    };
    await classStore.saveClass(newClass, authStore.currentAccount);
  }

  className.value = '';
  showNewClassDialog.value = false;
}

function navigateToClass(cls: ClassModel) {
  void router.push({ name: 'teacherClass', params: { classKey: cls.key } });
}

function getRandomColor(key: string): string {
  const colors: string[] = [
    '#FFD05A', //yellow
    '#944547', //maroon
    '#236533', //green
    '#023EBA', //blue
    '#b59e5f', //golden brown
    '#FF9B9B', //pink
    '#0D92F4', //skyblue
    '#ECB176', //skintone
    '#FF9843', //orange
  ];

  if (!key) return colors[0] as string;
  const keyChars = key.split('');

  const index = keyChars.reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index] || (colors[0] as string);
}

function getRandomPattern(key: string): string {
  const patterns: string[] = [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVBcdAfKCOGceIbmS6b_58K4FH5A6crxJpFPChhUTbP6Y4Uu1t0Obx63eVD2xhov1byKs&usqp=CAU',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwT0vob0t09Ei4S_lhZyxNgntyBf1GIxQVRCah6AdQLgcnO6_aSz_vGs7kSP8-dhAm7sA&usqp=CAU',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhwNgPhsaSJJRnSg19zUcKuOKukm_6UTtukA&s',
    'data:image/jpeg;base64,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',
    'data:image/jpeg;base64,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',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuADcFkpCCl27cS-Dtih_Gw07cw-w4Qd4XWmWQW43XpQZigopHz90yLeDlMghqg7ubVMg&usqp=CAU',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrGM-nbPsAO6OTfOhdt8rf4gXXHpfH7Owaa60xsaG7NX6epc7lf06CROxxzfuJqZBOdmo&usqp=CAU',
  ];

  if (!key) return patterns[0] as string;

  const keyChars = key.split('');
  const index = keyChars.reduce((sum, char) => sum + char.charCodeAt(0), 0) % patterns.length;
  return (patterns[index] || patterns[0]) as string;
}

function copyInviteLink(cls: ClassModel): void {
  if (!cls || !cls.classCode) return;

  const inviteLink = `${cls.classCode}`;

  copyToClipboard(inviteLink)
    .then(() => {
      Notify.create({
        message: 'Invitation link copied to clipboard',
        color: 'green',
        icon: 'content_copy',
        position: 'top',
        timeout: 2000,
      });
    })
    .catch(() => {
      Notify.create({
        message: 'Failed to copy invitation link',
        color: 'negative',
        icon: 'error',
        position: 'top',
        timeout: 2000,
      });
    });
}

function deleteCourse(cls: ClassModel) {
  $q.dialog({
    title: 'Delete Class',
    message: 'Are you sure you want to delete this class?',
    cancel: true,
  }).onOk(() => {
    void classStore
      .deleteClass(cls.key || '')
      .then(() => {
        Notify.create({
          message: 'Class deleted successfully',
          color: 'green',
          icon: 'check_circle',
          position: 'top',
          timeout: 3000,
        });
      })
      .catch(() => {
        Notify.create({
          message: 'Failed to delete course',
          color: 'negative',
          icon: 'error',
          position: 'top',
          timeout: 3000,
        });
      });
  });
}

function createAttendance() {
  void router.push({ name: 'createAttendance' });
}
</script>

<template>
  <q-page class="q-pa-md allCards">
    <div class="row items-center justify-between q-mb-lg">
      <div class="text-h5 text-weight-bold">My Classes</div>
      <q-btn
        color="primary"
        icon="assignment"
        label="Create Attendance"
        @click="createAttendance"
        unelevated
      />
    </div>

    <div class="row q-col-gutter-md">
      <div
        class="boxes"
        v-for="theClass in teacherClasses"
        :key="String(theClass.key)"
        @click="navigateToClass(theClass)"
      >
        <q-card class="card" @click="navigateToClass(theClass)">
          <div
            class="banner"
            :style="{
              backgroundColor: getRandomColor(theClass.key || ''),
              backgroundImage: `url(${getRandomPattern(theClass.key || '')})`,
            }"
          >
            <div class="banner-content">
              <span class="avatar">
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">
                    {{ theClass.name[0] }}
                  </q-avatar>
                </q-item-section>
              </span>
              <span>
                <q-item-section>
                  <q-item-label>
                    <div class="name">{{ theClass.name }}</div>
                    <div class="section">{{ theClass.section }}</div>
                  </q-item-label>
                </q-item-section>
              </span>
              <div class="dots">
                <q-btn round flat color="white" icon="more_vert" size="sm" @click.stop>
                  <q-menu>
                    <q-list style="min-width: 150px">
                      <q-item clickable v-close-popup @click="copyInviteLink(theClass)">
                        <q-item-section avatar>
                          <q-icon name="content_copy" color="red" />
                        </q-item-section>
                        <q-item-section>Copy invite link</q-item-section>
                      </q-item>
                      <q-separator />
                      <q-item clickable v-close-popup @click="deleteCourse(theClass)">
                        <q-item-section avatar>
                          <q-icon name="delete" color="red" />
                        </q-item-section>
                        <q-item-section>Delete</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </div>
          </div>

          <div class="code">
            <q-item-section>
              <q-item-label caption
                >{{ theClass.academicYear }} • {{ theClass.classCode }}</q-item-label
              >
            </q-item-section>
          </div>
        </q-card>
      </div>

      <div v-if="teacherClasses.length === 0" class="col-12">
        <q-card class="text-center q-pa-md">
          <q-card-section>
            <q-icon name="school" size="4rem" color="grey-5" />
            <div class="text-h6 q-mt-md text-grey">No classes yet</div>
            <div class="text-caption q-mt-sm">Click the + button to create your first class</div>
            <div class="q-mt-md">
              <q-btn color="primary" label="Add new Class" @click="addNewClass" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="showNewClassDialog" persistent>
      <q-card class="create-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div class="dialog-title">Create class</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <p class="dialog-description q-mb-md">
            You're creating a class. After you enter the class name and section, you can add
            students.
          </p>
          <q-input
            v-model="className"
            label="Class name"
            outlined
            class="q-mb-md dialog-input"
            :rules="[
              (v) => !!v || 'Class name is required',
              (v) => v.length >= 3 || 'Name must be at least 3 characters',
            ]"
          />
          <q-input
            v-model="classSection"
            label="Section"
            outlined
            class="q-mb-md dialog-input"
            :rules="[(v) => !!v || 'Class section is required']"
          />
          <div class="class-code-section q-mb-md">
            <span class="text-caption">The class code will be automatically generated:</span>
            <span class="text-weight-bold">{{
              Math.random().toString(36).substring(2, 6).toUpperCase()
            }}</span>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md dialog-actions">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup class="dialog-btn" />
          <q-btn
            unelevated
            label="Create"
            color="primary"
            @click="saveClass"
            :disable="!className || !classSection"
            class="dialog-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.dashboard-card {
  background-color: white;
  border-radius: 10px;
  border: solid 0.5px rgb(224, 224, 224);
}

.card {
  width: 290px;
  border-radius: 5%;
  background-color: white;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: scale(1.03);
}

.banner {
  height: 90px;
  border-radius: 5% 5% 0 0;
}

.banner-content {
  display: flex;
  padding-left: 5%;
  padding-right: 5%;
  padding-top: 15%;
}

.avatar {
  padding-left: 0%;
}

.name {
  font-size: large;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 1);
}

.section {
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 1);
}

.code {
  padding-left: 5%;
  padding-right: 10%;
  padding-bottom: 15%;
  padding-top: 3%;
}

.allCards {
  margin-left: 1%;
  margin-top: 2%;
}

.dots {
  padding-left: 40%;
  margin-top: -11%;
}

.boxes {
  margin-left: 5px;
  margin-right: 5px;
}

.popUpName {
  border: 1px;
  color: green;
}

.popUpSection {
  border: 1px;
}

.text-h6 {
  text-align: center;
}

.create-dialog {
  width: 90vw;
  max-width: 500px;
  margin: 20px;

  @media (max-width: 599px) {
    width: 95vw;
    margin: 10px;
  }
}

.dialog-title {
  font-size: 1.5rem;
  font-weight: 500;

  @media (max-width: 599px) {
    font-size: 1.25rem;
  }
}

.dialog-description {
  font-size: 0.875rem;
  line-height: 1.4;

  @media (max-width: 599px) {
    font-size: 0.8rem;
  }
}

.dialog-input {
  .q-field__label {
    font-size: 1rem;

    @media (max-width: 599px) {
      font-size: 0.875rem;
    }
  }
}

.class-code-section {
  background: rgba(0, 0, 0, 0.03);
  padding: 12px;
  border-radius: 8px;

  @media (max-width: 599px) {
    padding: 8px;
    font-size: 0.875rem;
  }
}

.dialog-actions {
  @media (max-width: 599px) {
    padding: 8px !important;
  }
}

.dialog-btn {
  min-width: 85px;

  @media (max-width: 599px) {
    min-width: 70px;
    font-size: 0.875rem;
  }
}
</style>
