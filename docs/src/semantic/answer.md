```c
#include "stdlib.h"
#include "stdio.h"
#include "string.h"

typedef char* string;

struct bucket {string key; void *binding; struct bucket *next;};
int INIT_SIZE = 109;

unsigned int hash(char *s0)
{unsigned int h=0; char *s;
    for(s=s0; *s; s++)
        h = h*65599 + *s;
    return h;
}
struct bucket *Bucket(string key, void *binding, struct bucket *next) {
    struct bucket *b = (struct bucket* )malloc(sizeof(*b));
    b->key=key; b->binding=binding; b->next=next;
    return b;
}
// 哈希表结构体
typedef struct hashTable {
    struct bucket **table;
    int size;
    int elementCount;
} HashTable;
HashTable* createHashTable(int initialSize) {
    HashTable *newTable = (HashTable*)malloc(sizeof(HashTable));
    newTable->table = (struct bucket**)malloc(sizeof(struct bucket*) * initialSize);
    newTable->size = initialSize;
    newTable->elementCount = 0;

    // 将所有新的桶初始化为空
    for(int i = 0; i < initialSize; i++){
        newTable->table[i] = NULL;
    }

    return newTable;
}

void rehash(HashTable *hashTable) {
    int old_size = hashTable->size;  // 记忆旧的大小
    hashTable->size *= 2;  // 双倍放大
    struct bucket **new_table;  // 新的哈希表

    // 为新的哈希表分配空间
    new_table = (struct bucket **)malloc(sizeof(struct bucket *) * hashTable->size);

    // 将所有新的桶初始化为空
    for(int i = 0; i < hashTable->size; i++){
        new_table[i] = NULL;
    }

    // 复制旧元素到新的哈希表
    for(int i = 0; i < old_size; i++){
        struct bucket *iter = hashTable->table[i];
        while(iter != NULL){
            int index = hash(iter->key) % hashTable->size;
            new_table[index] = Bucket(iter->key, iter->binding, new_table[index]);
            struct bucket *old_bucket = iter;
            iter = iter->next;
            free(old_bucket);  // 释放掉旧的元素（即原链表里的节点）
        }
    }

    // 释放旧的哈希表
    free(hashTable->table);

    // 更新table到新的哈希表
    hashTable->table = new_table;
}
void insert(HashTable *hashTable, string key, void *binding) {
    int index = hash(key) % hashTable->size;

    // 插入新的键值对
    struct bucket *new_bucket = Bucket(key, binding, hashTable->table[index]);
    hashTable->table[index] = new_bucket;

    // 更新全局元素数量
    hashTable->elementCount++;

    // 如果平均长度大于2,进行扩容
    if(hashTable->elementCount > hashTable->size * 2){
        rehash(hashTable);
    }
}
void* lookup(HashTable *hashTable, string key) {
    int index = hash(key) % hashTable->size;
    for (struct bucket *b = hashTable->table[index]; b; b = b->next) {
        if (strcmp(b->key, key) == 0) {
            return b->binding;
        }
    }
    return NULL;  // 如果找不到，返回NULL
}
void pop(HashTable *hashTable, string key) {
    int index = hash(key) % hashTable->size;
    if(hashTable->table[index] != NULL) {
        struct bucket* toDelete = hashTable->table[index];
        hashTable->table[index] = hashTable->table[index]->next;
        free(toDelete);
    }
    hashTable->elementCount--;
}

int main() {
    HashTable *hashTable1 = createHashTable(INIT_SIZE);
    HashTable *hashTable2 = createHashTable(INIT_SIZE);
    int cnt1 = 0;
    int cnt2 = 0;

    // 打开文件
    FILE *file = fopen("testdata.txt", "r");
    if (file == NULL) {
        printf("Can't open the file.\n");
        return 1;
    }

    // 读取并处理文件中的每一行
    char operation[7];
    int table_num;
    string key = (string)malloc(sizeof(char) * 100);
    int* value = (int*)malloc(sizeof(int));

    int flag = 1;
    int old_size;
    int new_size;
    while (fscanf(file, "%s %d %s %d", operation, &table_num, key, value) == 4) {
        if (strcmp(operation, "insert") == 0) {
            if (table_num == 1) {
                if(cnt1 == hashTable1->size * 2) {
                    old_size = hashTable1->size;
                    printf("rehashing hashTable1:\n");
                    printf("old size: %d\n", hashTable1->size);
                    insert(hashTable1, key, value);

                    new_size = hashTable1->size;
                    printf("new size: %d\n", hashTable1->size);
                    if(old_size * 2 != new_size) {
                        flag = 0;
                    }
                }
                else {
                    insert(hashTable1, key, value);
                }
                cnt1++;
            } else if (table_num == 2) {
                if(cnt2 == hashTable2->size * 2) {
                    old_size = hashTable2->size;
                    printf("rehashing hashTable2:\n");
                    printf("old size: %d\n", hashTable2->size);
                    insert(hashTable2, key, value);

                    new_size = hashTable2->size;
                    printf("new size: %d\n", hashTable2->size);

                    if(old_size * 2 != new_size) {
                        flag = 0;
                    }
                }
                else {
                    insert(hashTable2, key, value);
                }
                cnt2++;
            } else {
                printf("Invalid table number: %d\n", table_num);
            }
        } else {
            printf("Invalid operation: %s\n", operation);
        }

        value = (int*)malloc(sizeof(int));
        key = (string)malloc(sizeof(char) * 100);
    }

    if(flag == 1) {
        printf("All rehashing operations are correct\n");
    }
    else {
        printf("Some rehashing operations are incorrect\n");
    }

    fseek(file, 0, SEEK_SET);

    int _value;
    flag = 1;
    while (fscanf(file, "%s %d %s %d", operation, &table_num, key, &_value) == 4) {
        if (table_num == 1) {
            if (lookup(hashTable1, key) == NULL) {
                printf("key: %s not found\n", key);
                flag = 0;
            }
        }
        else {
            if (lookup(hashTable2, key) == NULL) {
                printf("key: %s not found\n", key);
                flag = 0;
            }
        }
    }

    if(flag == 1) {
        printf("All keys found\n");
    }
    else {
        printf("Some keys not found\n");
    }

    fclose(file);

    return 0;
}
```
