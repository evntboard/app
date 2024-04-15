import * as z from 'zod';

export const folderDeleteFormSchema = z.object({
  path: z.string().refine((value) => /^\/(?:[^\/]+\/)*$/.test(value), 'Name should be a path')
});

export const folderDuplicateFormSchema = z.object({
  path: z.string().refine((value) => /^\/(?:[^\/]+\/)*$/.test(value), 'Name should be a path'),
  targetPath: z.string().refine((value) => /^\/(?:[^\/]+\/)*$/.test(value), 'Name should be a path')
});

export const folderMoveFormSchema = z.object({
  path: z.string().refine((value) => /^\/(?:[^\/]+\/)*$/.test(value), 'Name should be a path'),
  targetPath: z.string().refine((value) => /^\/(?:[^\/]+\/)*$/.test(value), 'Name should be a path')
});

export const folderEnableFormSchema = z.object({
  path: z.string().refine((value) => /^\/(?:[^\/]+\/)*$/.test(value), 'Name should be a path')
});

export const folderDisableFormSchema = z.object({
  path: z.string().refine((value) => /^\/(?:[^\/]+\/)*$/.test(value), 'Name should be a path')
});