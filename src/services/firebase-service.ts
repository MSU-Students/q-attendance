// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup, signOut, User,
  updateProfile
} from "firebase/auth";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc, doc,
  getCountFromServer, getDoc,
  getDocFromCache, getDocs,
  getFirestore, or, query,
  QueryFieldFilterConstraint,
  setDoc, where, WhereFilterOp,
  onSnapshot
} from "firebase/firestore";
import { Entity } from 'src/models/base.model';
import { CollectionName, CollectionTypes } from './collection.type';

function copyObject<T>(source: T) {
  return JSON.parse(JSON.stringify(source)) as T;
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBBvkqJvNP-_ckaW2owswfZKV6Z9xWj_Dg",
  authDomain: "msu-attendance.firebaseapp.com",
  projectId: "msu-attendance",
  storageBucket: "msu-attendance.firebasestorage.app",
  messagingSenderId: "387029555303",
  appId: "1:387029555303:web:d1dd8378a746cbd051dcc2",
  measurementId: "G-20RGVYT37W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
//firestore: https://firebase.google.com/docs/firestore/quickstart
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);


type WhereArgs = Parameters<typeof where>;
type Operand = Partial<Record<WhereFilterOp, WhereArgs[2]>>;
type WhereCondition<T extends Entity> = Partial<Record<keyof T, Operand>>;
export type Condition<T extends Entity> = WhereCondition<T>[] | WhereCondition<T>;

class FirebaseService {
  /**
   * https://firebase.google.com/docs/auth/web/google-signin
   */
  async signInWithGoogle() {
    const authentication = await signInWithPopup(auth, googleProvider);
    return authentication.user;
  }
  /**
   * https://firebase.google.com/docs/auth/web/password-auth
   * @param email
   * @param password
   */
  async registerWithEmailPassword(email: string, password: string, displayName: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, {
      displayName
    })
    return credential.user;
  }
  /**
   * https://firebase.google.com/docs/auth/web/password-auth
   * @param email
   * @param password
   */
  async signWithEmailPassword(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }
  signOut() {
    return signOut(auth)
  }
  /**
   * https://firebase.google.com/docs/auth/web/start
   * @returns User
   */
  async authorizeUser() {
    return new Promise<User | undefined>((resolve) => {
      if (auth.currentUser) {
        resolve(auth.currentUser);
      } else {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            resolve(user);
          } else {
            // User is signed out
            // ...
            resolve(undefined);
          }
        });
      }
    })
  }
  /**
   * https://firebase.google.com/docs/auth/web/manage-users
   * @param email
   * @returns
   */
  resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }
  //CRUD
  async createRecord<C extends CollectionName>(collectionName: C, record: CollectionTypes[C], path?: string): Promise<CollectionTypes[C] | undefined> {
    //https://firebase.google.com/docs/firestore/query-data/get-data#example_data
    let collRef = collection(db, collectionName);
    if (path) {
      const parts = path.split('/');
      const [colName] = parts.splice(1, 1);
      collRef = collection(db, colName!, [...parts, collectionName].join('/'));
    }
    try {
      if (!record.key) {
        const docRef = await addDoc(collRef, copyObject({
          ...record
        }));
        record.key = docRef.id;
      } else {
        const docRef = doc(collRef, record.key);
        await setDoc(docRef, copyObject({
          ...record
        }));
      }
      return record;
    } catch (e) {
      console.error("Error adding document: ", e);
    }
    return undefined;
  }
  /**
   * https://firebase.google.com/docs/firestore/query-data/get-data#get_a_document
   * @param collectionName
   * @param key
   * @param path
   * @returns
   */
  async getRecord<C extends CollectionName>(collectionName: C, key: string, path?: string): Promise<CollectionTypes[C] | undefined> {
    let collRef = collection(db, collectionName);
    if (path) {
      const parts = path.split('/');
      const [colName] = parts.splice(1, 1);
      collRef = collection(db, colName!, [...parts, collectionName].join('/'));
    }
    const docRef = doc(collRef, key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CollectionTypes[C];
    }
    return undefined;
  }
  /**
  * https://firebase.google.com/docs/firestore/query-data/get-data#source_options
  * @param collectionName
  * @param key
  * @param path
  * @returns
  */
  async getCachedRecord<C extends CollectionName>(collectionName: C, key: string, path?: string): Promise<CollectionTypes[C] | undefined> {
    let collRef = collection(db, collectionName);
    if (path) {
      const parts = path.split('/');
      const [colName] = parts.splice(1, 1);
      collRef = collection(db, colName!, [...parts, collectionName].join('/'));
    }
    const docRef = doc(collRef, key);
    const docSnap = await getDocFromCache(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CollectionTypes[C];
    }
    return undefined;
  }
  /**
   * https://firebase.google.com/docs/firestore/manage-data/add-data#set_a_document
   * @param collectionName
   * @param key
   * @param record
   * @param path
   * @returns
   */
  async updateRecord<C extends CollectionName>(collectionName: C, key: string, record: Partial<CollectionTypes[C]>, path?: string): Promise<boolean> {

    let collRef = collection(db, collectionName);
    if (path) {
      const parts = path.split('/');
      const [colName] = parts.splice(1, 1);
      collRef = collection(db, colName!, [...parts, collectionName].join('/'));
    }
    const docSnap = doc(collRef, key);
    try {
      await setDoc(docSnap, copyObject(record), { merge: true });
      return true;
    } catch (error) {
      console.error('failed to update record:', error);
    }
    return false;
  }
  /**
   * https://firebase.google.com/docs/firestore/manage-data/delete-data
   * @param collectionName
   * @param key
   * @param path
   * @returns
   */
  async deleteRecord<C extends CollectionName>(collectionName: C, key: string, path?: string): Promise<boolean> {
    let collRef = collection(db, collectionName);
    if (path) {
      const parts = path.split('/');
      const [colName] = parts.splice(1, 1);
      collRef = collection(db, colName!, [...parts, collectionName].join('/'));
    }
    const docRef = doc(collRef, key);
    try {
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('failed to deleting record:', error);
    }
    return false;
  }

  getAndWhere<T extends Entity>(condition: WhereCondition<T>) {
    const andCon: QueryFieldFilterConstraint[] = [];
    const cond = copyObject(condition);
    for (const prop in cond) {
      const con = cond[prop];
      for (const op in con) {
        const operator = op as WhereFilterOp;
        const val = con?.[operator];
        andCon.push(where(prop, operator, val));
      }
    }
    return andCon;
  }
  getCollRef<C extends CollectionName>(collRef: CollectionReference, condition?: Condition<CollectionTypes[C]>) {
    if (Array.isArray(condition)) {
      const orCon: QueryFieldFilterConstraint[] = [];
      for (const con of condition) {
        orCon.push(...this.getAndWhere(con));
      }
      return query(collRef, or(...orCon));
    } else if (condition) {
      const andCon = this.getAndWhere(condition);
      if (andCon.length) {
        return query(collRef, ...andCon);
      }
    }
    return collRef;
  }
  async findRecords<C extends CollectionName>(collectionName: C, path?: string, condition?: Condition<CollectionTypes[C]>): Promise<CollectionTypes[C][]> {
    let collRef = collection(db, collectionName);
    if (path) {
      const parts = path.split('/');
      const [colName] = parts.splice(1, 1);
      collRef = collection(db, colName!, [...parts, collectionName].join('/'));
    }
    const snapshot = await getDocs(this.getCollRef(collRef, condition));
    if (snapshot.empty) {
      return [];
    } else {
      return snapshot.docs.map((item) => item.data() as CollectionTypes[C]);
    }
  }
  /**
   * https://firebase.google.com/docs/firestore/query-data/listen
   * @param collectionName
   * @param path
   * @param condition
   * @returns
   */
  streamRecords<C extends CollectionName>(
    collectionName: C, options: {
      path?: string,
      condition?: Condition<CollectionTypes[C]>,
      onSnapshot: (docs: CollectionTypes[C][]) => void | Promise<void>
    }) {
    let collRef = collection(db, collectionName);
    if (options.path) {
      const parts = options.path.split('/');
      const [colName] = parts.splice(1, 1);
      collRef = collection(db, colName!, [...parts, collectionName].join('/'));
    }
    return onSnapshot(this.getCollRef(collRef, options.condition), (querySnapshot) => {
      const records: CollectionTypes[C][] = [];
      querySnapshot.forEach((doc) => {
        records.push(doc.data() as CollectionTypes[C]);
      });
      void options.onSnapshot(records);
    })
  }

  async countRecords<C extends CollectionName>(collectionName: C, path?: string, condition?: Condition<CollectionTypes[C]>): Promise<number> {
    let collRef = collection(db, collectionName);
    if (path) {
      const parts = path.split('/');
      const [colName] = parts.splice(1, 1);
      collRef = collection(db, colName!, [...parts, collectionName].join('/'));
    }
    const response = await getCountFromServer(this.getCollRef(collRef, condition));
    return response.data().count;
  }

}

export const firebaseService = new FirebaseService();
