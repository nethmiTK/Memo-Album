export const template1 = {
  id: 'template-1',
  name: 'Mosaic Portrait',
  description: 'Asymmetric collage with hero portrait panel.',
  pages: [
    { pageNumber: 1, slots: ['leftHero', 'leftWide', 'leftBottom', 'leftTall', 'rightHero', 'rightBottomMain', 'rightBottomSide'] },
    { pageNumber: 2, slots: ['leftWide', 'leftMain', 'leftBottom', 'leftInset', 'rightHero', 'rightBottomMain', 'rightBottomSide'] },
    { pageNumber: 3, slots: ['leftMain', 'leftInsetA', 'leftInsetB', 'leftTall', 'rightMain', 'rightBottomA', 'rightBottomB'] },
    { pageNumber: 4, slots: ['leftHero', 'leftInset', 'leftBottom', 'leftCard', 'rightHero', 'rightBottom', 'rightCard'] },
    { pageNumber: 5, slots: ['leftWide', 'leftTall', 'leftBottom', 'leftInset', 'rightMain', 'rightFooter', 'rightBottomA'] },
  ],
} as const;
