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

onUnmounted(()=>{
  window.removeEventListener('open-create-class-dialog', addNewClass);
})

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

function getRandomColor(key: string): string{ 
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

   const index = keyChars.reduce((sum , char) => sum + char.charCodeAt(0), 0) % colors.length;
   return (colors[index] || colors[0] as string);

}

function copyInviteLink(cls: ClassModel): void {
  if (!cls||!cls.classCode) return;

  const inviteLink=`${cls.classCode}`;

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
    .catch(()=>{
      Notify.create({
        message: 'Failed to copy invitation link',
        color: 'negative',
        icon: 'error',
        position: 'top',
        timeout: 2000,
      });
    });
}

function deleteCourse(cls: ClassModel){
  $q.dialog({
    title: 'Delete Class',
    message: 'Are you sure you want to delete this class?',
    cancel: true,
  }).onOk(()=>{
    void classStore
      .deleteClass(cls.key || '')
      .then(()=>{
        Notify.create({
          message: 'Class deleted successfully',
          color: 'green',
          icon: 'check_circle',
          position: 'top',
          timeout: 3000,
        });
      })
      .catch(()=>{
        Notify.create({
          message: 'Failed to delete course',
          color: 'negative',
          icon: 'error',
          position: 'top',
          timeout: 3000,
        });
      })

  })
}

</script>

<template>
  <q-page class="q-pa-md allCards">
    <div class="row q-col-gutter-md">
      
            <div class="boxes"
              v-for="theClass in teacherClasses"
              :key="String(theClass.key)"
              @click="navigateToClass(theClass)"
            >


              <q-card class="card" @click="navigateToClass(theClass)">
                <div class="banner" :style="{
                  backgroundColor: getRandomColor(theClass.key || '')
                  }">
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
                                <q-icon name="content_copy" color="red"/>
                              </q-item-section>
                              <q-item-section>Copy invite link</q-item-section>
                            </q-item>
                          <q-separator/>
                            <q-item clickable v-close-popup @click="deleteCourse(theClass)">
                              <q-item-section avatar>
                               <q-icon name="delete" color="red"/>
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

            <q-item v-if="teacherClasses.length === 0">
              <q-item-section>
                <q-item-label class="text-center text-grey">No classes yet</q-item-label>
              </q-item-section>
            </q-item>
          
    </div>

    <q-dialog v-model="showNewClassDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">New Class</div>
        </q-card-section>

        <q-card-section>
            <q-input outlined
              v-model="className"
              label="Class Name"
              :rules="[
                (v) => !!v || 'Class name is required',
                (v) => v.length >= 3 || 'Name must be at least 3 characters',
              ]"
            />
            <q-input outlined
              v-model="classSection"
             label="Class Section"
             :rules="[(v) => !!v || 'Class section is required']"
            />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="negative" v-close-popup />
          <q-btn flat label="Create" color="positive" @click="saveClass" :disable="!className" />
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
  width: 300px;
  border-radius: 5%;
  background-color: white;
  box-shadow: 0 1px 6px rgba(0,0,0,0.3);
  transition: transform 0.2s ease; 
  margin: 2.5%;
}

.card:hover{
  transform: scale(1.03);
}

.banner{

  height: 90px;
  border-radius: 5% 5% 0 0;
} 

.banner-content {
  display: flex;
  padding-left: 5%;
  padding-right: 5%;
  padding-top: 15%;
}

.avatar{
  padding-left: 0%;
}

.name{
  font-size: large;
  font-weight: bold;  
  color: white; 
}

.section{
  color: white;
}

.code {
  padding-left: 5%;
  padding-right: 10%;
  padding-bottom: 15%;
  padding-top: 3%;
}       
 
.allCards{
  margin-left: 1%;
  margin-top: 2%;
} 

.dots{
  padding-left: 40%;
  margin-top:-11%;
}

.boxes{
  margin-left: 5px;
  margin-right: 5px;
}

.popUpName{
  border: 1px;
  color: green;
}

.popUpSection{
  border: 1px;
}

.text-h6{
  text-align: center;
}

</style>

