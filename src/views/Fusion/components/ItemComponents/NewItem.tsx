import React, { useEffect, useState, useContext } from 'react'
import { Flex, Text, Tag } from '@pancakeswap-libs/uikit'
import styled from 'styled-components'
import NonFungiblePlayer from 'config/abi/NonFungiblePlayer.json'
import Web3 from 'web3'
import { PINATA_BASE_URI } from 'config/constants/nfts'
import { AbiItem } from 'web3-utils'
import { getNonFungiblePlayerAddress } from 'utils/addressHelpers'
import { LoadingContext } from 'contexts/LoadingContext'
import { StakeContext } from 'contexts/StakeContext'
import SelectNFT from './SelectNFT'

const ImageContainer = styled.div`
  position: relative;
  padding-bottom: 100%;
  height: 0;
  border-top-right-radius: 16px;
  border-top-left-radius: 16px;
  background-color: #101820;
  cursor: pointer;
`

const NftImage = styled.div`
  transition: transform 0.3s ease, -webkit-transform 0.3s ease;
  transform-origin: center;
  background-size: auto 100%;
  background-position: 50%;
  background-repeat: no-repeat;
  left: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  border-top-right-radius: 16px;
  border-top-left-radius: 16px;
  top: 0;
`

const AddImage = styled.div`
  transition: transform 0.3s ease, -webkit-transform 0.3s ease;
  transform-origin: center;
  background-size: auto 100%;
  background-position: 50%;
  background-repeat: no-repeat;
  background-image: url('/images/add.svg');
  left: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  &:hover {
    transform: scale(1.04);
  }
`

const Divider = styled.div`
  height: 1px;
  min-width: unset;
  background-image: url(../images/line.jpg);
  background-repeat: repeat-x;
  position: relative;
  background-size: contain;
  background-position: 50%;
`
const ItemContainer = styled.div`
  margin-right: 30px;
  margin-left: 30px;
  margin-bottom: 15px;
  border-radius: 16px;
  background: #27262c;
  box-shadow: 0px 2px 12px -8px rgba(203, 203, 203, 0.7), 0px 1px 1px rgba(203, 203, 203, 0.05);
  position: relative;
`

const web3 = new Web3(Web3.givenProvider)
const nfpContract = new web3.eth.Contract(NonFungiblePlayer.abi as AbiItem[], getNonFungiblePlayerAddress())

const NewItem = ({ index }) => {
  const [isOpen, setModalOpen] = useState(false)
  const { setLoading } = useContext(LoadingContext)
  const { selectedFirstNft, selectedSecondNft } = useContext(StakeContext)
  const [nftInfo, setNftInfo] = useState({
    tokenId: 0,
    tokenName: '',
    imageUrl: '',
    skillPoint: 0,
    level: 0,
    gen: 0,
    position: '',
    class: '',
  })

  useEffect(() => {
    const fetchNft = async () => {
      setLoading(true)

      if (index === 1) {
        if (selectedFirstNft.tokenId === 0) {
          setLoading(false)
          setNftInfo({
            tokenId: selectedFirstNft.tokenId,
            tokenName: '',
            imageUrl: '',
            skillPoint: 0,
            level: 0,
            gen: 0,
            position: '',
            class: 'tmpClass',
          })
          return
        }
        let tokenUri = ''
        let tmpSkillPoint = 0
        let tmpLevel = 0
        let tmpGen = 0
        let tmpClass = ''
        let tmpPosition = ''

        tokenUri = await nfpContract.methods.tokenURI(selectedFirstNft.tokenId).call()
        tmpSkillPoint = await nfpContract.methods.getSkillPoint(selectedFirstNft.tokenId).call()
        tmpLevel = await nfpContract.methods.getLevel(selectedFirstNft.tokenId).call()
        tmpGen = await nfpContract.methods.getGeneration(selectedFirstNft.tokenId).call()
        tmpClass = await nfpContract.methods.getClass(selectedFirstNft.tokenId).call()
        tmpPosition = await nfpContract.methods.getPosition(selectedFirstNft.tokenId).call()
        const res = await fetch(tokenUri)
        const json = await res.json()
        let tmpImageUrl = json.image
        tmpImageUrl = tmpImageUrl.slice(7)
        tmpImageUrl = `${PINATA_BASE_URI}${tmpImageUrl}`

        setNftInfo({
          tokenId: selectedFirstNft.tokenId,
          tokenName: json.name,
          imageUrl: tmpImageUrl,
          skillPoint: tmpSkillPoint,
          level: tmpLevel,
          gen: tmpGen,
          position: tmpPosition,
          class: tmpClass,
        })
      } else {
        if (selectedSecondNft.tokenId === 0) {
          setLoading(false)
          setNftInfo({
            tokenId: selectedSecondNft.tokenId,
            tokenName: '',
            imageUrl: '',
            skillPoint: 0,
            level: 0,
            gen: 0,
            position: '',
            class: 'tmpClass',
          })
          return
        }
        let tokenUri = ''
        let tmpSkillPoint = 0
        let tmpLevel = 0
        let tmpGen = 0
        let tmpClass = ''
        let tmpPosition = ''

        tokenUri = await nfpContract.methods.tokenURI(selectedSecondNft.tokenId).call()
        tmpSkillPoint = await nfpContract.methods.getSkillPoint(selectedSecondNft.tokenId).call()
        tmpLevel = await nfpContract.methods.getLevel(selectedSecondNft.tokenId).call()
        tmpGen = await nfpContract.methods.getGeneration(selectedSecondNft.tokenId).call()
        tmpClass = await nfpContract.methods.getClass(selectedSecondNft.tokenId).call()
        tmpPosition = await nfpContract.methods.getPosition(selectedSecondNft.tokenId).call()
        const res = await fetch(tokenUri)
        const json = await res.json()
        let tmpImageUrl = json.image
        tmpImageUrl = tmpImageUrl.slice(7)
        tmpImageUrl = `${PINATA_BASE_URI}${tmpImageUrl}`

        setNftInfo({
          tokenId: selectedSecondNft.tokenId,
          tokenName: json.name,
          imageUrl: tmpImageUrl,
          skillPoint: tmpSkillPoint,
          level: tmpLevel,
          gen: tmpGen,
          position: tmpPosition,
          class: tmpClass,
        })
      }
      setLoading(false)
    }
    fetchNft()
    // eslint-disable-next-line
  }, [selectedFirstNft, selectedSecondNft, index])
  const closeDialog = () => {
    setModalOpen(false)
  }

  return (
    <ItemContainer style={{ background: '#27262c' }}>
      {nftInfo.tokenId === 0 ? (
        <Flex flexDirection="column">
          <ImageContainer style={{ background: '#101820' }} onClick={(e) => setModalOpen(true)}>
            <AddImage />
          </ImageContainer>
          <Divider />
          <Flex flexDirection="column" style={{ padding: '24px' }}>
            <Text fontSize="24px" style={{ textAlign: 'center' }}>
              Add NFT
            </Text>
          </Flex>
        </Flex>
      ) : (
        <Flex flexDirection="column">
          <ImageContainer onClick={(e) => setModalOpen(true)}>
            <NftImage style={{ backgroundImage: `url('${nftInfo.imageUrl}')` }} />
          </ImageContainer>
          <Divider />
          <Flex flexDirection="column" style={{ padding: '24px' }}>
            <Text fontSize="20px" style={{ textAlign: 'center', marginBottom: '15px' }}>
              {nftInfo.tokenName}
            </Text>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '5px' }}>
              <Text>Skill Point: </Text> &nbsp;&nbsp;
              <Text fontSize="15px">{nftInfo.skillPoint}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '5px' }}>
              <Text>Level: </Text> &nbsp;&nbsp;
              <Text fontSize="15px">{nftInfo.level}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '5px' }}>
              <Text>Generation: </Text> &nbsp;&nbsp;
              <Text fontSize="15px">{nftInfo.gen}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '5px' }}>
              <Text>Position: </Text> &nbsp;&nbsp;
              <Text fontSize="15px">{nftInfo.position}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
              <Text>Class: </Text> &nbsp;&nbsp;
              <Text fontSize="15px">{nftInfo.class}</Text>
            </div>
          </Flex>
        </Flex>
      )}
      <SelectNFT isOpen={isOpen} closeDialog={closeDialog} index={index} />
    </ItemContainer>
  )
}

export default NewItem
