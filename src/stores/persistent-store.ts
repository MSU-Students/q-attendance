import { Collection, Table } from 'dexie';
import { defineStore, acceptHMRUpdate } from 'pinia';
import { CollectionName, CollectionTypes } from 'src/services/collection.type';
import { localDb } from 'src/services/dexie-service';
import { Condition, copyObject, firebaseService } from 'src/services/firebase-service';
import { IndexType } from 'typescript';

export const usePersistentStore = defineStore('persistent', {
  state: () => ({
    online: false
  } as { online: boolean }),
  getters: {
  },
  actions: {
    updateOnlineState(online: boolean) {
      this.online = online;
      if (online) {
        localDb.tables.map(table => {
          //sync created record offline
          table.filter((obj => obj.created_online === false))
            .each(async (record) => {
              if (record.path) {
                const path = record.path as string;
                await firebaseService.createRecord(table.name as keyof CollectionTypes, record, path);
              } else {
                await firebaseService.createRecord(table.name as keyof CollectionTypes, record);
              }
              if (!record.path) {
                await localDb.table(table.name).update(record.key, {
                  created_online: new Date()
                });
              } else {
                await localDb.table(table.name).update([record.path, record.key], {
                  created_online: new Date()
                });
              }
            });
          //sync updated record offline
          table.filter((obj => obj.updated_online === false))
            .each(async (record) => {
              const path = record.path as string;
              await firebaseService.updateRecord(table.name as keyof CollectionTypes, record.key, record, path);
              if (!record.path) {
                await localDb.table(table.name).update(record.key, {
                  updated_online: new Date()
                });
              } else {
                await localDb.table(table.name).update([record.path, record.key], {
                  updated_online: new Date()
                });
              }
            });
          table.filter((obj => !!obj.deleted_offline))
            .each(async (record) => {
              const path = record.path as string;
              await firebaseService.deleteRecord(table.name as keyof CollectionTypes, record.key, path);

              await localDb.table(table.name).delete(record.path ? [record.path, record.key] : record.key);

            });
        })
      }
    },
    async createRecord<C extends CollectionName>(collectionName: C, record: CollectionTypes[C], path?: string): Promise<CollectionTypes[C] | undefined> {
      if (this.online) {
        await firebaseService.createRecord(collectionName, copyObject(record), path);
        const item = {
          ...record,
          created_online: new Date(),
          path: path
        };
        await localDb.table(collectionName).add(item);
        return item;
      } else {
        const item = {
          ...record,
          path,
          created_online: false
        };
        await localDb.table(collectionName).add(item);
        return item;
      }
    },
    async getRecord<C extends CollectionName>(collectionName: C, key: string, path?: string): Promise<CollectionTypes[C] | undefined> {
      if (this.online) {
        const record = await firebaseService.getRecord(collectionName, key, path) as CollectionTypes[C];
        if (!record) {
          return;
        }
        const oldRecord = await localDb.table(collectionName).get(path ? [path, key] : key);
        if (oldRecord) {
          const item = {
            ...oldRecord,
            ...record,
            path,
            created_online: oldRecord.created_online || new Date()
          };
          await localDb.table(collectionName).update(path ? [path, key] : key, item);
          return item;
        } else {
          const item = {
            ...record,
            path,
            created_online: new Date()
          };
          await localDb.table(collectionName).add(item);
          return item;
        }
      } else if (!path) {
        return await localDb.table(collectionName).get(key) as CollectionTypes[C];
      } else {
        return await localDb.table(collectionName).get([path, key]) as CollectionTypes[C];
      }
    },
    async updateRecord<C extends CollectionName>(collectionName: C, key: string, record: Partial<CollectionTypes[C]>, path?: string): Promise<boolean> {
      const oldRecord = await localDb.table(collectionName).get(path ? [path, key] : key);
      if (oldRecord && oldRecord.created_online === false && this.online) {
        await firebaseService.createRecord(collectionName, copyObject(oldRecord), path);
      }
      if (this.online) {
        await firebaseService.updateRecord(collectionName, key, copyObject(record), path);
        const item = {
          ...record,
          path,
          updated_online: new Date()
        };
        await localDb.table(collectionName).update(path ? [path, key] : key, copyObject(item));
        return !!item;
      } else {
        const item = {
          ...record,
          path,
          updated_online: false
        };
        await localDb.table(collectionName).update(path ? [path, key] : key, copyObject(item));
        return !!item;
      }
    },
    async deleteRecord<C extends CollectionName>(collectionName: C, key: string, path?: string): Promise<boolean> {
      const oldRecord = await localDb.table(collectionName).get(path ? [path, key] : key);
      if (oldRecord && oldRecord.created_online === false && this.online) {
        await localDb.table(collectionName).delete(path ? [path, key] : key);
        return true;
      }
      if (this.online) {
        await firebaseService.deleteRecord(collectionName, key, path);
        await localDb.table(collectionName).delete(path ? [path, key] : key);
      } else {
        const item = {
          ...oldRecord,
          path,
          deleted_offline: new Date()
        };
        await localDb.table(collectionName).update(path ? [path, key] : key, item);
      }
      return true;
    },
    keyValueToCondition<C extends CollectionName>(condition?: Partial<Record<keyof CollectionTypes[C], any>>): Condition<CollectionTypes[C]> | undefined {
      const whereCon: Condition<CollectionTypes[C]> = {};
      if (!condition) return;
      for (const prop in condition) {
        whereCon[prop] = typeof condition[prop] == 'object' ? condition[prop]! : {
          "==": condition[prop]
        }
      }
      return whereCon;
    },
    async findRecords<C extends CollectionName>(collectionName: C, path?: string, condition?: Partial<Record<keyof CollectionTypes[C], any>>): Promise<CollectionTypes[C][]> {
      if (this.online) {
        const results = await (condition ? firebaseService.findRecords(collectionName, path, this.keyValueToCondition(condition))
          : firebaseService.findRecords(collectionName, path));
        results.forEach(async (item) => {
          const old = await localDb.table(collectionName).get(path ? [path, item.key] : item.key);
          if (old) {
            await localDb.table(collectionName).update(path ? [path, item.key] : item.key, {
              ...item,
              created_online: new Date()
            })
          } else {
            await localDb.table(collectionName).add({
              ...item,
              created_online: new Date()
            });
          }
        });
        return results;
      } else {
        const table = localDb.table(collectionName);
        const query = condition ? filterWithCondition(table as any, condition) : table;
        return (await query.toArray()).filter(d => !d.deleted_offline);
      }
    },
    async countRecords<C extends CollectionName>(collectionName: C, path?: string, condition?: Record<string, string>): Promise<number> {
      if (this.online) {
        return firebaseService.countRecords(collectionName, path, condition as any);
      } else {
        return 0;
      }
    }
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePersistentStore, import.meta.hot));
}

function filterWithCondition<C extends CollectionName>(table: Table<any, IndexType, any>, condition: Partial<Record<keyof CollectionTypes[C], any>>) {
  const pure = Object.values(condition).every((c) => typeof c != 'object');
  if (pure) {
    return table.where(condition);
  } else {
    const keys = Object.keys(condition);
    const firstProp = keys.shift() as string;
    const firstCondition = (condition as Record<string, any>)[firstProp];
    const operators = Object.keys(firstCondition);
    const query = evalOperator(firstProp, operators.shift()!, firstCondition);
    const subQuery = evalExtraOperators(operators, firstProp, firstCondition, query!);
    return keys.reduce((query: Collection<any, IndexType, any>, prop: string) => {
      const con = (condition as any)[prop];
      return evalExtraOperators(Object.keys(con), prop, con, query);
    }, subQuery);
  }
  function evalExtraOperators(operators: string[], prop: string, condition: any, query: Collection<any, IndexType, any>) {
    if (operators.length) {
      return query.filter((item => {
        return operators.reduce((val, operator) => {
          if (!val) return false;
          if (operator === '==') {
            return item[prop] === condition[operator];
          } else if (operator === '!=') {
            return item[prop] !== condition[operator];
          } else if (operator === '>') {
            return item[prop] > condition[operator];
          } else if (operator === '<') {
            return item[prop] < condition[operator];
          } else if (operator === '<=') {
            return item[prop] <= condition[operator];
          } else if (operator === '>=') {
            return item[prop] >= condition[operator];
          } else if (operator == 'in' && Array.isArray(condition[operator])) {
            return condition[operator].includes(item[prop]);
          } else {
            return false;
          }
        }, true)
      }));
    } else {
      return query;
    }
  }

  function evalOperator(prop: string, operator: string, condition: any) {
    if (operator === 'in') {
      return table.where(prop).anyOf(condition[operator]);
    } else if (operator === '==') {
      return table.where(prop).equals(condition[operator]);
    } else if (operator === '>') {
      return table.where(prop).above(condition[operator]);
    } else if (operator === '>=') {
      return table.where(prop).aboveOrEqual(condition[operator]);
    } else if (operator === '<') {
      return table.where(prop).below(condition[operator]);
    } else if (operator === '<=') {
      return table.where(prop).belowOrEqual(condition[operator]);
    } else if (operator === '!=') {
      return table.where(prop).notEqual(condition[operator]);
    }
  }
}
