import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canSubmitCard,
  canSubmitContent,
  filterCommunityPosts,
  getPublishSubmitLabel,
  getVisibleContentItems,
  type SearchableCommunityPost,
} from './logic.ts';

const POSTS: SearchableCommunityPost[] = [
  { id: '1', username: '桂花拿铁', content: '周末带崽晒太阳', distance: '2.1km' },
  { id: '2', username: 'PawGuide', content: '猫咪洗护知识整理', distance: '5.0km' },
];

test('recommend tab keeps updates while knowledge tab switches to guides', () => {
  const updates = [{ id: 'u1', title: '动态' }];
  const guides = [{ id: 'g1', title: '指南' }];

  assert.deepEqual(getVisibleContentItems('recommend', updates, guides), updates);
  assert.deepEqual(getVisibleContentItems('knowledge', updates, guides), guides);
  assert.deepEqual(getVisibleContentItems('post', updates, guides), []);
});

test('search only filters community posts by user text content and distance', () => {
  assert.equal(filterCommunityPosts(POSTS, '').length, 2);
  assert.equal(filterCommunityPosts(POSTS, '洗护').length, 1);
  assert.equal(filterCommunityPosts(POSTS, '2.1').length, 1);
});

test('publish button label follows upload type', () => {
  assert.equal(getPublishSubmitLabel('card'), '发布宠物卡片');
  assert.equal(getPublishSubmitLabel('update'), '发布动态');
  assert.equal(getPublishSubmitLabel('guide'), '发布指南');
});

test('content publish requires login and required fields', () => {
  assert.equal(
    canSubmitContent({ isLoggedIn: false, uploadType: 'update', title: '标题', subtitle: '副标题' }),
    false
  );
  assert.equal(
    canSubmitContent({ isLoggedIn: true, uploadType: 'update', title: '标题', subtitle: '副标题' }),
    true
  );
  assert.equal(
    canSubmitContent({ isLoggedIn: true, uploadType: 'guide', title: '  ', subtitle: '副标题' }),
    false
  );
});

test('card publish requires login and basic fields', () => {
  assert.equal(
    canSubmitCard({ isLoggedIn: false, name: '团子', breed: '英短', age: '2', location: '杭州' }),
    false
  );
  assert.equal(
    canSubmitCard({ isLoggedIn: true, name: '团子', breed: '英短', age: '2', location: '杭州' }),
    true
  );
  assert.equal(
    canSubmitCard({ isLoggedIn: true, name: '团子', breed: '', age: '2', location: '杭州' }),
    false
  );
});
