import { describe, expect, test } from 'vitest'

import { generateTree } from '../tree'

describe('generateTree', () => {
  test('should return great format', () => {
    const triggerList = [
      { name: '/test', id: '1', enable: true, },
      { name: '/test/test', id: '2', enable: false, }
    ]

    expect(generateTree('/', triggerList, [])).toEqual({
      slug: '/',
      name: 'root',
      type: 'folder',
      children: [
        {
          slug: '/test/',
          name: 'test',
          type: 'folder',
          children: [
            {
              id: '2',
              slug: '/test/test',
              name: 'test',
              type: 'trigger',
              enable: false,
            }
          ]
        },
        {
          id: '1',
          slug: '/test',
          name: 'test',
          type: 'trigger',
          enable: true,
        }
      ]
    })
  })

  test('should return great format more advanced', () => {
    const triggerList = [
      { name: '/test', id: '1' },
      { name: '/test/test', id: '2' },
      { name: '/test/test/waza', id: '3' },
      { name: '/test/test/bidule/chouette', id: '4' },
      { name: '/a/b/c/chouette', id: '5' },
      { name: '/a/b/c/d', id: '6' }
    ]

    expect(generateTree('/', triggerList, [])).toEqual({
      slug: '/',
      name: 'root',
      type: 'folder',
      children: [
        {
          slug: '/a/',
          name: 'a',
          type: 'folder',
          children: [
            {
              slug: '/a/b/',
              name: 'b',
              type: 'folder',
              children: [
                {
                  slug: '/a/b/c/',
                  name: 'c',
                  type: 'folder',
                  children: [
                    {
                      slug: '/a/b/c/chouette',
                      name: 'chouette',
                      type: 'trigger',
                      enable: false,
                      id: '5'
                    },
                    {
                      slug: '/a/b/c/d',
                      name: 'd',
                      type: 'trigger',
                      enable: false,
                      id: '6'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          slug: '/test/',
          name: 'test',
          type: 'folder',
          children: [
            {
              slug: '/test/test/',
              name: 'test',
              type: 'folder',
              children: [
                {
                  slug: '/test/test/bidule/',
                  name: 'bidule',
                  type: 'folder',
                  children: [
                    {
                      slug: '/test/test/bidule/chouette',
                      name: 'chouette',
                      type: 'trigger',
                      enable: false,
                      id: '4'
                    }
                  ]
                },
                {
                  slug: '/test/test/waza',
                  name: 'waza',
                  type: 'trigger',
                  enable: false,
                  id: '3'
                }
              ]
            },
            {
              slug: '/test/test',
              name: 'test',
              type: 'trigger',
              enable: false,
              id: '2'
            }
          ]
        },
        {
          slug: '/test',
          name: 'test',
          type: 'trigger',
          enable: false,
          id: '1'
        }
      ]
    })
  })
})
