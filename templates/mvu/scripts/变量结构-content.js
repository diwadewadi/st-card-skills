import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

export const Schema = z.object({
  // 根据角色卡需求定义变量结构
});

$(() => {
  registerMvuSchema(Schema);
})
